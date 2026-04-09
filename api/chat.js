export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, messages } = req.body;
  // Note: Vercel uses process.env for environment variables
  const hfToken = process.env.VITE_HF_TOKEN;

  if (!hfToken) {
    return res.status(500).json({ 
      error: 'VITE_HF_TOKEN is not configured on Vercel. Please add it to your Environment Variables in the Vercel Dashboard.' 
    });
  }

  try {
    const response = await fetch("https://router.huggingface.co/together/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hfToken}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless Function Error (Chat):', error);
    return res.status(500).json({ error: 'Failed to connect to Hugging Face Reality Router.' });
  }
}
