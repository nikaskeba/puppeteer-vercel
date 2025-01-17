const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Please provide a URL as a query parameter.' });
  }

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // For Vercel, you might need to set the executable path to the Chromium provided by Vercel
      // executablePath: '/usr/bin/chromium-browser',
    });
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get the page content
    const content = await page.content();

    // Close the browser
    await browser.close();

    // Return the content
    res.status(200).send(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the website content.' });
  }
};