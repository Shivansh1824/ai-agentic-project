import "@supabase/functions-js/edge-runtime.d.ts"

// Define CORS headers so the browser can make requests to this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the prompt from the incoming request body
    const { prompt } = await req.json()

    if (!prompt) {
      throw new Error('No prompt provided')
    }

    // 2. Retrieve the Google API key from the environment/vault
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is missing from environment variables')
    }

    // 3. Make the secure server-side request to the Google API
    // Using gemini-3.0-flash as requested
    const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent`
    
    const googleResponse = await fetch(googleEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    })

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text()
      console.error('Google API Error:', errorText)
      throw new Error(`Google API returned ${googleResponse.status}`)
    }

    // 4. Parse the Google API response
    const googleData = await googleResponse.json()
    
    // Extract the text content from the Gemini response structure
    const generatedText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated."

    // 5. Send the text back to the frontend
    return new Response(
      JSON.stringify({ response: generatedText }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      },
    )

  } catch (error: unknown) {
    // Catch any errors and return them cleanly
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Function error:", errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 400 
      },
    )
  }
})
