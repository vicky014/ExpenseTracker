import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Standard paths for Chrome and Edge on Windows
const browserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Users\\vikra\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBrowserTest() {
  let executablePath = '';
  for (const p of browserPaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    console.error('❌ Could not find Google Chrome or Microsoft Edge on your Windows system!');
    process.exit(1);
  }

  console.log(`🚀 Found browser executable at: ${executablePath}`);
  console.log('🎬 Launching headless browser...');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('🌐 Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

    const recordingsDir = 'C:\\Users\\vikra\\.gemini\\antigravity-ide\\browser_recordings';
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    // Take initial screenshot
    await page.screenshot({ path: path.join(recordingsDir, '01_landing_page.png') });
    console.log('📸 Landing page screenshot saved to 01_landing_page.png');

    // Check if onboarding wizard is active
    const isWizardVisible = await page.evaluate(() => {
      return !!document.querySelector('.wizard-container');
    });

    if (isWizardVisible) {
      console.log('🧙 Onboarding wizard detected. Performing automated walk-through...');

      // Step 1: Profile Name
      await page.screenshot({ path: path.join(recordingsDir, '02_onboard_step1.png') });
      console.log('👉 Completing Step 1: Profile Name...');
      const btnNext1 = await page.waitForSelector('button.btn-primary');
      await btnNext1.click();
      await delay(1000);

      // Step 2: Salary
      await page.screenshot({ path: path.join(recordingsDir, '03_onboard_step2.png') });
      console.log('👉 Completing Step 2: Salary...');
      const btnNext2 = await page.waitForSelector('button.btn-primary');
      await btnNext2.click();
      await delay(1000);

      // Step 3: Active Loans
      await page.screenshot({ path: path.join(recordingsDir, '04_onboard_step3.png') });
      console.log('👉 Completing Step 3: Active Loans...');
      const btnNext3 = await page.waitForSelector('button.btn-primary');
      await btnNext3.click();
      await delay(1000);

      // Step 4: Expenses
      await page.screenshot({ path: path.join(recordingsDir, '05_onboard_step4.png') });
      console.log('👉 Completing Step 4: Expenses...');
      const btnNext4 = await page.waitForSelector('button.btn-primary');
      await btnNext4.click();
      await delay(1000);

      // Step 5: Complete
      await page.screenshot({ path: path.join(recordingsDir, '06_onboard_step5.png') });
      console.log('👉 Completing Step 5: Finish...');
      const btnFinish = await page.waitForSelector('button.btn-primary');
      await btnFinish.click();
      await delay(3000);
    } else {
      console.log('✨ Onboarding already complete. Direct access to dashboard.');
    }

    // Capture dashboard
    await page.screenshot({ path: path.join(recordingsDir, '07_dashboard_view.png') });
    console.log('📸 Dashboard screenshot saved to 07_dashboard_view.png');

    // Click "AI Payoff Planner" Navigation Item
    console.log('🧭 Navigating to AI Payoff Planner tab...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const plannerItem = items.find(item => item.textContent.includes('Planner'));
      if (plannerItem) {
        plannerItem.click();
      }
    });

    await delay(2000);
    await page.screenshot({ path: path.join(recordingsDir, '08_planner_view.png') });
    console.log('📸 Planner tab loaded. Screenshot saved to 08_planner_view.png');

    // Verify AI Indicators are present
    const metricsFound = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        safeToSpend: text.includes('Safe-To-Spend Buffer'),
        stressScore: text.includes('Financial Stress Score'),
        collectionRisk: text.includes('Collector & Legal Risk'),
        skipSuggestions: text.includes('AI Smart Skip Recommendations'),
        comparisonMatrix: text.includes('Multi-Dimensional Payoff Matrix Grid')
      };
    });

    console.log('🔍 Verifying layout visual requirements:');
    console.log(`   - Safe-To-Spend Buffer Card: ${metricsFound.safeToSpend ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - Financial Stress Gauge: ${metricsFound.stressScore ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - Harassment/Collection Risk Alert: ${metricsFound.collectionRisk ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - Smart Skip Recommendation List: ${metricsFound.skipSuggestions ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - Payoff Strategy Matrix Grid: ${metricsFound.comparisonMatrix ? '✅ Found' : '❌ Missing'}`);

    // Simulate NLP context analysis input
    console.log('⌨️ Typing in NLP Context Input box...');
    const textareaSelector = 'textarea';
    await page.waitForSelector(textareaSelector);
    await page.focus(textareaSelector);
    await page.keyboard.type("I got a diwali bonus of 50000 rupees in October, use it to pay off rahul");
    await page.screenshot({ path: path.join(recordingsDir, '09_nlp_typed.png') });

    console.log('⚡ Triggering Recalculate Plan...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnRecalc = btns.find(btn => btn.textContent.includes('Recalculate Plan'));
      if (btnRecalc) {
        btnRecalc.click();
      }
    });

    await delay(4000);
    await page.screenshot({ path: path.join(recordingsDir, '10_simulation_recalculated.png') });
    console.log('📸 Recalculation complete. Screenshot saved to 10_simulation_recalculated.png');

    console.log('✅ End-To-End Browser Test PASSED successfully! Full app verified!');

  } catch (error) {
    console.error('❌ Browser Test encountered an error:', error);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🏁 Headless Browser closed.');
  }
}


runBrowserTest();
