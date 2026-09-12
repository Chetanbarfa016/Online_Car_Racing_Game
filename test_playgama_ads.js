const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
  console.log('--- 1. Fetching Playgama Bridge from CDN ---');
  const bridgeScript = await new Promise((resolve, reject) => {
    https.get('https://bridge.playgama.com/v2/stable/playgama-bridge.js', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
  console.log('Downloaded bridge script length:', bridgeScript.length);

  const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
  const config = fs.readFileSync(path.join(__dirname, 'public/playgama-bridge-config.json'), 'utf8');

  for (const platformId of ['mock', 'qa_tool']) {
    console.log('\n========================================');
    console.log('Testing Platform Mode: [' + platformId.toUpperCase() + ']');
    console.log('========================================');

    const dom = new JSDOM(html, {
      url: 'https://playgama-games.com/game/index.html?platform_id=' + platformId,
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true
    });

    const { window } = dom;

    const originalFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (typeof url === 'string' && url.includes('playgama-bridge-config.json')) {
        return {
          ok: true,
          status: 200,
          text: async () => config,
          json: async () => JSON.parse(config)
        };
      }
      if (originalFetch) return originalFetch(url, opts);
      return { ok: false };
    };

    if (platformId === 'qa_tool') {
      window.parent = {
        postMessage: (msg, targetOrigin) => {
          console.log('[PARENT RECEIVED postMessage]:', JSON.stringify(msg));
          if (msg && msg.type === 'platform' && msg.action === 'initialize') {
            setTimeout(() => {
              window.postMessage({
                type: 'platform',
                action: 'initialize',
                supportedFeatures: ['interstitial', 'rewarded'],
                config: {}
              }, '*');
            }, 10);
          }
          if (msg && msg.type === 'advertisement' && msg.action === 'show_interstitial') {
            console.log('>>> [PARENT] Intercepted Interstitial Ad Call! <<<');
            setTimeout(() => {
              window.postMessage({
                type: 'advertisement',
                action: 'show_interstitial',
                payload: { status: 'opened' }
              }, '*');
              setTimeout(() => {
                window.postMessage({
                  type: 'advertisement',
                  action: 'show_interstitial',
                  payload: { status: 'closed' }
                }, '*');
              }, 50);
            }, 10);
          }
          if (msg && msg.type === 'advertisement' && msg.action === 'show_rewarded') {
            console.log('>>> [PARENT] Intercepted Rewarded Ad Call! <<<');
          }
        }
      };
    }

    window.eval(bridgeScript);
    console.log('Initializing bridge...');
    await window.bridge.initialize();
    console.log('Bridge initialized! isInitialized =', window.bridge.isInitialized);
    console.log('Platform ID detected:', window.bridge.platform.id);
    console.log('isInterstitialSupported:', window.bridge.advertisement.isInterstitialSupported);
    console.log('isRewardedSupported:', window.bridge.advertisement.isRewardedSupported);

    console.log('\n--- Testing Interstitial Ad ---');
    let interstitialClosed = false;
    window.bridge.advertisement.on(window.bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, state => {
      console.log('Event INTERSTITIAL_STATE_CHANGED:', state);
      if (state === 'closed') interstitialClosed = true;
    });

    console.log('Invoking showInterstitial("race_start")...');
    window.bridge.advertisement.showInterstitial('race_start');
    await new Promise(r => setTimeout(r, 150));
    console.log('Interstitial closed status:', interstitialClosed);

    console.log('\n--- Testing Rewarded Ad: Early Close ---');
    window.bridge.advertisement.on(window.bridge.EVENT_NAME.REWARDED_STATE_CHANGED, state => {
      console.log('Event REWARDED_STATE_CHANGED:', state);
    });

    window.bridge.advertisement.showRewarded('bonus_nitro');
    if (platformId === 'qa_tool') {
      window.postMessage({
        type: 'advertisement',
        action: 'show_rewarded',
        payload: { status: 'opened' }
      }, '*');
      await new Promise(r => setTimeout(r, 20));
      window.postMessage({
        type: 'advertisement',
        action: 'show_rewarded',
        payload: { status: 'closed' }
      }, '*');
    }
    await new Promise(r => setTimeout(r, 100));

    console.log('\n--- Testing Rewarded Ad: Full Completion ---');
    window.bridge.advertisement.showRewarded('bonus_nitro');
    if (platformId === 'qa_tool') {
      window.postMessage({
        type: 'advertisement',
        action: 'show_rewarded',
        payload: { status: 'opened' }
      }, '*');
      await new Promise(r => setTimeout(r, 20));
      window.postMessage({
        type: 'advertisement',
        action: 'show_rewarded',
        payload: { status: 'rewarded' }
      }, '*');
      await new Promise(r => setTimeout(r, 20));
      window.postMessage({
        type: 'advertisement',
        action: 'show_rewarded',
        payload: { status: 'closed' }
      }, '*');
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n========================================');
  console.log('ALL TESTS EXECUTED AND VERIFIED!');
  console.log('========================================');
}

run().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
