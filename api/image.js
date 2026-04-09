export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, prompt } = req.body;
  const hfToken = process.env.VITE_HF_TOKEN;

  if (!hfToken) {
    return res.status(500).json({ 
      error: 'VITE_HF_TOKEN is not configured on Vercel. Please add it to your Environment Variables.' 
    });
  }

  try {
    const response = await fetch("https://router.huggingface.co/nscale/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hfToken}`,
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      // If it's a direct image stream (binary)
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.setHeader('Content-Type', contentType || 'image/png');
      // Set cache control for performance
      res.setHeader('Cache-Control', 's-maxage=86400');
      
      return res.status(response.status).send(buffer);
    }
  } catch (error) {
    console.error('Serverless Function Error (Image):', error);
    return res.status(500).json({ error: 'Failed to connect to Hugging Face Reality Router.' });
  }
}
