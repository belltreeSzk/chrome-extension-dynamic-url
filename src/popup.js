'use strict';

import './popup.css';
import $ from 'jquery';
import QRCode from 'qrcode';
import ClipboardJS from 'clipboard';

import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/brands";
import "@fortawesome/fontawesome-free/js/solid";
import "@fortawesome/fontawesome-free/js/regular";

(function() {
  let shortUrl = '';
  let apiToken = '';
  let resultLink = '';

  let targetPageTitle = '';

  main();
  function main () {
    chrome.storage.sync.get(['shortUrl', 'apiToken'], function(value) {
      if (typeof value.shortUrl !== 'undefined' && value.shortUrl !== '') {
        shortUrl = value.shortUrl;
      }
      if (typeof value.apiToken !== 'undefined' && value.apiToken !== '') {
        apiToken = value.apiToken;
      }

      // 設定が完了していない場合、options画面に移動
      if (shortUrl === '' || apiToken === '') {
        if (chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open(chrome.runtime.getURL('options.html'));
        }
        return;
      }

      // 現在開いているページを変換に掛ける
      chrome.tabs.getSelected(null, function(tab) {
        targetPageTitle = tab.title;
        const longUrl = encodeURI(tab.url);
        convertURL(longUrl);
      })
    });
  }

  /**
   * URLを短縮化する
   * @param longURL
   */
  function convertURL (longURL) {
    const data = {
      "longDynamicLink": shortUrl + "?link=" + longURL,
      "suffix": {
        "option": "SHORT"
      }
    };

    $.ajax({
      type: 'POST',
      url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' + apiToken,
      data: JSON.stringify(data),
      contentType: 'application/json',
      dataType: "json",
      success : function(response){
        resultLink = response.shortLink;

        // QRコードの作成
        generateQRCode(resultLink);

        // 確認用URLを表示
        const url = document.getElementById('url');
        url.innerText = resultLink;
        url.setAttribute('href', resultLink);

        initCopyButton();
        initTwitterButton();
        initFacebookButton();
      },
      error: function(response){
        // 変換できないURLです
        const message = document.getElementById('message');
        message.innerText = 'Conversion failed.';

        const canvas = document.getElementById('canvas')
        canvas.classList.add('hide');

        const warning = document.getElementById('warning')
        warning.classList.remove('hide');

        const copyButton = document.getElementById('copy');
        copyButton.classList.add('disable');

        const twitterButton = document.getElementById('twitter-share');
        twitterButton.classList.add('disable');

        const facebookButton = document.getElementById('facebook-share');
        facebookButton.classList.add('disable');
      },
      complete: function (response) {
        const cover = document.getElementById('cover');
        cover.style.display ='none';
      }
    });
  }

  /**
   * QRコードの作成
   * @param shortUrl
   */
  function generateQRCode (shortUrl) {
    const canvas = document.getElementById('canvas')
    QRCode.toCanvas(canvas, shortUrl, function (error) {
      if (error) {
        console.error(error)
      }
    });
  }

  /**
   * コピーボタンの初期化
   */
  function initCopyButton () {
    const clipboard = new ClipboardJS('.btn');
    clipboard.on('success', function(e) {
      const copyButton = document.getElementById('copy');
      copyButton.innerHTML = '<i class="fas fa-copy"></i> Copied!'
      copyButton.classList.add('clipboard-copied');
      copyButton.addEventListener('mouseleave', function() {
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy'
        copyButton.classList.remove('clipboard-copied');
      });
      e.clearSelection();
    });

    clipboard.on('error', function(e) {
      console.error('Action:', e.action);
      console.error('Trigger:', e.trigger);
    });
  }

  /**
   * Twitter用のボタン
   */
  function initTwitterButton () {
    const twitterButton = document.getElementById('twitter-share');
    twitterButton.addEventListener('click', function () {
      const url = document.getElementById('url');
      url.innerText = resultLink;
      url.setAttribute('href', resultLink);

      const openUrl = 'https://twitter.com/intent/tweet?text=' + encodeURI(targetPageTitle) + ' ' +  url.innerText;
      window.open(openUrl);
    });
  }

  /**
   * Facebook用のボタン
   */
  function initFacebookButton () {
    const facebookButton = document.getElementById('facebook-share');
    facebookButton.addEventListener('click', function () {
      const url = document.getElementById('url');
      url.innerText = resultLink;
      url.setAttribute('href', resultLink);
      const openUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url.innerText;
      window.open(openUrl);
    });
  }
})();

