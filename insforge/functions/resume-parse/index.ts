import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    // Since we are in an Edge Function, we can use InsForge AI to parse the text
    // First, let's extract text if it's text/plain, or use AI to "read" the PDF if supported.
    // For now, we'll assume the text is extracted or we'll use a simple prompt.
    // InsForge AI can take text. We'll read the file content as text.
    
    const text = await file.text();
    
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    const prompt = `
      Extract information from the following resume text and return it in JSON format.
      The JSON should have the following structure:
      {
        "contact": { "name": string, "email": string, "phone": string, "location": string },
        "profile": { "headline": string, "skills": string[], "experience_years": number, "education": string },
        "meta": { "confidence": number }
      }

      Resume Text:
      ${text.slice(0, 5000)}
    `;

    const { data: aiResponse, error: aiError } = await insforge.ai.chat.completions.create({
      model: 'gpt-4o', // or whatever model InsForge supports
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    if (aiError) {
      return new Response(JSON.stringify({ error: aiError.message }), { status: 500 });
    }

    const parsedData = JSON.parse(aiResponse.choices[0].message.content);

    return new Response(JSON.stringify(parsedData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Resume Parse Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
