'use server'

import OpenAI from 'openai';
import { XMLParser } from 'fast-xml-parser';
import { addChatMessage } from './todos';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    return name === 'item' || name === 'subItem';
  },
});

interface ParsedItem {
  name: string;
  notes?: string;
  deadline?: string;
  isCompleted: boolean;
  subItems: string | { subItem: Array<{ name: string; isCompleted: boolean }> } | Array<{ name: string; isCompleted: boolean }>;
}

interface ParsedList {
  name: string;
  items: {
    item: ParsedItem[];
  };
  isCompleted?: boolean;
}

function transformParsedList(parsedList: ParsedList) {
  const transformedList = {
    name: parsedList.name,
    isCompleted: parsedList.isCompleted ?? false,
    items: parsedList.items.item.map((item: ParsedItem) => ({
      name: item.name,
      notes: item.notes || undefined,
      deadline: item.deadline || undefined,
      isCompleted: item.isCompleted ?? false,
      subItems: Array.isArray(item.subItems) 
        ? item.subItems.map(subItem => ({
            name: subItem.name,
            isCompleted: subItem.isCompleted ?? false,
          }))
        : typeof item.subItems === 'object' && item.subItems?.subItem
        ? item.subItems.subItem.map(subItem => ({
            name: subItem.name,
            isCompleted: subItem.isCompleted ?? false,
          }))
        : []
    }))
  };

  return transformedList;
}

export async function processChat(todoListId: string, message: string, previousMessages: any[], currentList: any) {
  try {
    // Add user message to database
    const userMessage = await addChatMessage(
      todoListId,
      'user',
      message
    );

    // Prepare messages for GPT with current list state
    const messagesForGPT = [
      {
        role: 'system',
        content: `You are a helpful AI assistant that helps users manage their todo lists. 
        If the user says they want something, assume they are talking about adding it to the list.
        When suggesting changes to the list, always output the complete updated list wrapped in XML tags like this:
        <todo-list>
          <name>List Name</name>
          <items>
            <item>
              <name>Task name</name>
              <notes>Additional notes</notes>
              <deadline>2024-12-31</deadline>
              <isCompleted>false</isCompleted>
              <subItems>
                <subItem>
                  <name>Sub-task name</name>
                  <isCompleted>false</isCompleted>
                </subItem>
              </subItems>
            </item>
          </items>
        </todo-list>

        Always include the complete list in your response, including unchanged items.
        Maintain existing completion states unless explicitly asked to change them.
        Keep your natural language response separate from the XML structure.
        Be concise but helpful in your responses.`,
      },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: `${message}\nCurrent list state: ${JSON.stringify(currentList)}`,
      },
    ];

    // Get completion from GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForGPT,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const reply = response.choices[0].message.content;
    if (!reply) return { message: "No response from GPT", list: null };

    // Extract XML list
    const regex = /<todo-list>[\s\S]*?<\/todo-list>/;
    const match = reply.match(regex);

    let updatedList = null;
    if (match) {
      try {
        const parsed = parser.parse(match[0]);
        if (parsed['todo-list']) {
          updatedList = transformParsedList(parsed['todo-list']);
          console.log('Transformed list:', JSON.stringify(updatedList, null, 2));
        }
      } catch (e) {
        console.error('Failed to parse XML list:', e);
      }
    }

    // Remove XML from the message
    const cleanMessage = reply.replace(regex, '').replace(/list:/g, 'list!').replace(/```[\s\S]*?```/g, '').trim();

    // Save the assistant's message
    const assistantMessage = await addChatMessage(
      todoListId,
      'assistant',
      cleanMessage
    );

    return {
      message: cleanMessage,
      list: updatedList
    };
  } catch (error) {
    console.error('Error processing chat:', error);
    throw new Error('Failed to process chat message');
  }
}