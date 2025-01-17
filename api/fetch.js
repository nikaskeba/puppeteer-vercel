const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Please provide a URL as a query parameter.' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  let browser = null;

  try {
    // Launch Puppeteer with chrome-aws-lambda settings
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: 'new', // Opt into the new headless mode
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Optimize page loading by blocking unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate to the URL with optimized settings
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Get the page content
    const content = await page.content();

    // Close the browser
    await browser.close();

    // Return the content with appropriate headers
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(content);
  } catch (error) {
    console.error('Error fetching the website:', error);

    if (browser !== null) {
      await browser.close();
    }

    // Differentiate between timeout and other errors
    if (error.message.includes('Navigation timeout')) {
      return res.status(504).json({ error: 'Fetching the website timed out.' });
    }

    return res.status(500).json({ error: 'Failed to fetch the website content.' });
  }
};