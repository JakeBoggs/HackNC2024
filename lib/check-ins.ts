import { prisma } from './prisma'
import axios from 'axios'

const globalForTimeout = global as unknown as { 
  isCheckInRunning?: boolean,
  checkInTimeout?: NodeJS.Timeout 
}

function start() {
  if (globalForTimeout.isCheckInRunning) return
  globalForTimeout.isCheckInRunning = true
  processCheckIns()
}

async function processCheckIns() {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        scheduledAt: {
          lte: new Date(),
        },
      },
      include: {
        user: true,
        item: {
          include: {
            todoList: true
          }
        }
      }
    })

    for (const checkIn of checkIns) {
      try {
        await axios.post('https://us.api.bland.ai/v1/calls', {
          "phone_number": checkIn.user.phoneNumber,
          "task": `You're an accountability assistant, and you’re calling ${checkIn.user.firstName} to check whether a given task has been completed. If the task has been completed, you will congratulate them for their hard work. If not, you will ask why they have not completed their task and offer any assistance in completing the task that you can. After they respond with a reason they haven't completed their task, push them to get back on track. Ask follow-up questions to ascertain the cause of the delay and to convince them to work on their tasks. \n\nHere’s an example dialogue\nPerson: Hello?\nYou: Hello, this is your accountability assistant, I’m calling to ask if you've completed your task?\nPerson: Yes  have.\nYou: Great! Congratulations and have a wonderful day.\n\nHere's a second example dialogue\nPerson: Hello?\nYou: Hello, this is your accountability assistant, I’m calling to ask if you've completed your task?\nPerson: I haven't.\nYou: I'm sad to hear that. Let me know if there's anything I can do to help. Why haven't you completed your task?\nPerson: I just lost track of time.\nYou: How about you can started now?.\nPerson: Sir, yes sir.\nYou: You've got this.
          Name of the task you are checking on: ${checkIn.item.name}.${
            checkIn.notes ? ` Notes: ${checkIn.notes}` : ''
          } This task is part of the todo list: ${checkIn.item.todoList.name}.`,
          "model": "enhanced",
          "language": "en",
          "voice": "nat",
          "voice_settings": {},
          "pathway_id": null,
          "local_dialing": false,
          "max_duration": 12,
          "answered_by_enabled": false,
          "wait_for_greeting": false,
          "record": false,
          "amd": false,
          "interruption_threshold": 100,
          "voicemail_message": null,
          "temperature": null,
          "transfer_phone_number": null,
          "transfer_list": {},
          "metadata": null,
          "pronunciation_guide": [],
          "start_time": null,
          "background_track": "none",
          "request_data": {},
          "tools": [],
          "dynamic_data": [],
          "analysis_preset": null,
          "analysis_schema": {},
          "webhook": null,
          "calendly": {}
        }, {
          headers: {
            'Authorization': process.env.BLAND_AI_API_KEY
          }
        })

        await prisma.checkIn.delete({
          where: { id: checkIn.id }
        })
      } catch (error) {
        console.error(`Failed to process check-in ${checkIn.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to process check-ins:', error)
  } finally {
    globalForTimeout.checkInTimeout = setTimeout(processCheckIns, 15 * 1000)
  }
}

start()