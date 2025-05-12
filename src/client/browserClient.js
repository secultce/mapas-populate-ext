import browser from 'webextension-polyfill';

export async function getCurrentTabUrl() {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    return new URL(tabs[0].url);
  } catch (error) {
    console.error('Error getting active tab:', error);
  }
}
