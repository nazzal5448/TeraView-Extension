document.addEventListener('DOMContentLoaded', () => {
  const linkInput = document.getElementById('linkInput');
  const previewBtn = document.getElementById('previewBtn');
  const loading = document.getElementById('loading');
  const errorMsg = document.getElementById('errorMsg');
  const errorText = document.getElementById('errorText');
  const resultCard = document.getElementById('resultCard');
  const previewImg = document.getElementById('previewImg');
  const imgWrapper = document.getElementById('imgWrapper');
  const previewTitle = document.getElementById('previewTitle');
  const openBtn = document.getElementById('openBtn');

  let currentValidUrl = '';

  // Focus input automatically
  linkInput.focus();

  // (Clipboard auto-fill removed to reduce permission requirements)

  linkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handlePreview();
    }
  });

  previewBtn.addEventListener('click', handlePreview);

  openBtn.addEventListener('click', () => {
    if (currentValidUrl) {
      chrome.tabs.create({ url: currentValidUrl });
    }
  });

  function isValidTeraBoxLink(url) {
    try {
      const parsed = new URL(url);
      const validDomains = ['terabox.com', 'www.terabox.com', '1024tera.com', 'www.1024tera.com', 'teraboxapp.com', 'www.teraboxapp.com'];
      return validDomains.includes(parsed.hostname) && (
        parsed.pathname.startsWith('/s/') || 
        parsed.pathname.startsWith('/sharing/') || 
        parsed.pathname.includes('/share/')
      );
    } catch {
      return false;
    }
  }

  function showError(msg) {
    loading.classList.add('hidden');
    resultCard.classList.add('hidden');
    errorText.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
  }

  async function handlePreview() {
    const rawUrl = linkInput.value.trim();
    hideError();
    resultCard.classList.add('hidden');

    if (!rawUrl) return;

    if (!isValidTeraBoxLink(rawUrl)) {
      showError('Invalid TeraBox link');
      return;
    }

    currentValidUrl = rawUrl;
    loading.classList.remove('hidden');

    try {
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Fetch failed');
      
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let title = '';
      let imageUrl = '';

      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) title = ogTitle.content;
      if (!title) {
        const titleTag = doc.querySelector('title');
        if (titleTag) title = titleTag.textContent;
      }
      if (!title) title = 'TeraBox File';

      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage) imageUrl = ogImage.content;
      
      previewTitle.textContent = title;
      
      if (imageUrl) {
        previewImg.src = imageUrl;
        imgWrapper.classList.remove('hidden');
        previewImg.onerror = () => {
          imgWrapper.classList.add('hidden');
        };
      } else {
        imgWrapper.classList.add('hidden');
      }

      loading.classList.add('hidden');
      resultCard.classList.remove('hidden');

    } catch (error) {
      showError('Could not preview this link');
    }
  }
});
