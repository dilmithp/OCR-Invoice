import OpenAI from 'openai';
import { LineItem } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CategoryResult {
    category: string;
    subcategory?: string;
    confidence: number;
    cleanDescription?: string;
}

/**
 * Clean OpenAI response by removing markdown code blocks
 */
function cleanOpenAIResponse(text: string): string {
    let cleaned = text.trim();

    // Define the backtick character to avoid parsing issues
    const backtick = String.fromCharCode(96); // This is `
    const codeBlockStart = backtick + backtick + backtick + 'json';
    const codeBlock = backtick + backtick + backtick;

    // Remove markdown code blocks
    if (cleaned.startsWith(codeBlockStart)) {
        cleaned = cleaned.replace(codeBlockStart, '');
    }
    if (cleaned.startsWith(codeBlock)) {
        cleaned = cleaned.replace(codeBlock, '');
    }
    if (cleaned.endsWith(codeBlock)) {
        cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
}

/**
 * Enhanced function to categorize invoice line items using OpenAI GPT-4
 * If items are missing categories, AI will analyze and assign them
 */
export async function enhanceLineItemsWithAI(lineItems: LineItem[]): Promise<LineItem[]> {
    if (!lineItems.length) return lineItems;

    // Separate items that need categorization
    const itemsNeedingCategories = lineItems.map((item, index) => ({
        item,
        index,
        needsCategory: !item.category || item.category === 'other' || item.category === 'uncategorized'
    }));

    const itemsToCategorize = itemsNeedingCategories.filter(x => x.needsCategory);

    if (itemsToCategorize.length === 0) {
        console.log('All items already have categories, skipping AI categorization');
        return lineItems;
    }

    console.log(`Found ${itemsToCategorize.length} items needing categorization`);

    // Extract descriptions for items that need categorization
    const descriptions = itemsToCategorize.map(x =>
        x.item.cleanDescription || x.item.description || x.item.rawText || 'Unknown item'
    );

    try {
        console.log('Sending uncategorized items to OpenAI for analysis...');

        const prompt = `Analyze these invoice line items and categorize each one. 

Items to categorize:
${descriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Available categories: food, cleaning, office, transportation, healthcare, entertainment, utilities, personal_care, other

For each item, determine:
1. Most appropriate category from the list above
2. More specific subcategory (optional)
3. Confidence level (0-100)
4. Clean/standardized description if the original is unclear

IMPORTANT: Return ONLY a valid JSON array, no markdown formatting.

Format:
[
  {
    "category": "food",
    "subcategory": "groceries", 
    "confidence": 95,
    "cleanDescription": "Fresh bread loaf"
  },
  {
    "category": "cleaning",
    "subcategory": "household",
    "confidence": 90,
    "cleanDescription": "Liquid detergent"
  }
]`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at categorizing invoice items. Analyze the context and meaning to assign the most appropriate category. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2, // Slightly higher for better category inference
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message.content?.trim();

        if (!responseText) {
            throw new Error('Empty response from OpenAI');
        }

        console.log('OpenAI categorization response:', responseText);

        // Clean the response
        const cleanedResponse = cleanOpenAIResponse(responseText);
        const categoryResults: CategoryResult[] = JSON.parse(cleanedResponse);

        if (!Array.isArray(categoryResults)) {
            throw new Error('OpenAI response is not an array');
        }

        console.log(`Received categories for ${categoryResults.length} items`);

        // Create enhanced items array
        const enhancedItems = [...lineItems];

        // Apply AI results to items that needed categorization
        itemsToCategorize.forEach((itemData, aiIndex) => {
            const aiResult = categoryResults[aiIndex];
            const originalIndex = itemData.index;

            if (aiResult) {
                enhancedItems[originalIndex] = {
                    ...enhancedItems[originalIndex],
                    category: aiResult.category || 'other',
                    subcategory: aiResult.subcategory,
                    cleanDescription: aiResult.cleanDescription || enhancedItems[originalIndex].cleanDescription,
                    aiConfidence: aiResult.confidence || 50,
                    aiCategorized: true, // Flag to show this was AI categorized
                };

                console.log(`Item "${descriptions[aiIndex]}" categorized as: ${aiResult.category} (${aiResult.confidence}% confidence)`);
            } else {
                // Fallback if AI didn't provide result for this item
                enhancedItems[originalIndex] = {
                    ...enhancedItems[originalIndex],
                    category: basicCategorization(enhancedItems[originalIndex].description || enhancedItems[originalIndex].rawText || ''),
                    aiConfidence: 0,
                    aiCategorized: false,
                };
            }
        });

        console.log('Enhanced all items with AI categorization');
        return enhancedItems;

    } catch (error) {
        console.error('OpenAI categorization error:', error);

        // Fallback: use basic categorization for items that needed it
        const fallbackItems = [...lineItems];

        itemsToCategorize.forEach((itemData) => {
            const originalIndex = itemData.index;
            fallbackItems[originalIndex] = {
                ...fallbackItems[originalIndex],
                category: basicCategorization(fallbackItems[originalIndex].description || fallbackItems[originalIndex].rawText || ''),
                aiConfidence: 0,
                aiCategorized: false,
            };
        });

        console.log('Used fallback categorization due to AI error');
        return fallbackItems;
    }
}


/**
 * Extract and enhance invoice data using OpenAI
 */
export async function enhanceInvoiceDataWithAI(rawText: string, extractedData: any): Promise<any> {
    try {
        const prompt = `Analyze this invoice text and extract enhanced information:

Raw invoice text:
${rawText.substring(0, 2000)}

Current extracted data:
${JSON.stringify(extractedData, null, 2)}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.

Format:
{
  "supplier_name": "cleaned supplier name",
  "invoice_date": "YYYY-MM-DD format",
  "invoice_number": "cleaned invoice number", 
  "total_amount": "numeric value only",
  "currency": "USD/EUR/etc",
  "payment_terms": "if mentioned",
  "line_items_count": "number of items",
  "invoice_type": "receipt/invoice/bill"
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at processing invoice data. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0]?.message.content?.trim();

        if (!responseText) {
            return {
                ...extractedData,
                aiEnhanced: false,
            };
        }

        console.log('OpenAI invoice enhancement response:', responseText);

        const cleanedResponse = cleanOpenAIResponse(responseText);
        console.log('Cleaned invoice enhancement response:', cleanedResponse);

        const enhancedData = JSON.parse(cleanedResponse);

        return {
            ...extractedData,
            ...enhancedData,
            aiEnhanced: true,
        };

    } catch (error) {
        console.error('OpenAI invoice enhancement error:', error);
        return {
            ...extractedData,
            aiEnhanced: false,
        };
    }
}

// Fallback basic categorization function
function basicCategorization(description: string): string {
    if (!description) return 'other';

    const desc = description.toLowerCase();

    if (desc.includes('food') || desc.includes('bread') || desc.includes('milk')) {
        return 'food';
    }

    if (desc.includes('clean') || desc.includes('detergent') || desc.includes('soap')) {
        return 'cleaning';
    }

    if (desc.includes('pen') || desc.includes('paper') || desc.includes('office')) {
        return 'office';
    }

    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('transport')) {
        return 'transportation';
    }

    if (desc.includes('medical') || desc.includes('medicine') || desc.includes('health')) {
        return 'healthcare';
    }

    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('game')) {
        return 'entertainment';
    }

    return 'other';
}
