'use strict';


import './options.css';
import $ from 'jquery';

import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/brands";
import "@fortawesome/fontawesome-free/js/solid";
import "@fortawesome/fontawesome-free/js/regular";

(function() {
  let successUrl = '';
  let successApiToken = '';

  main();
  function main () {
    chrome.storage.sync.get(['shortUrl', 'apiToken'], function(value) {
      const shortUrl = document.getElementById('short-url');
      const apiToken = document.getElementById('api-token');
      if (value.shortUrl && value.shortUrl) {
        shortUrl.value = value.shortUrl;
        apiToken.value = value.apiToken;
      } else {
        shortUrl.value = '';
        apiToken.value = '';
      }
    });

    initSettingButton();
  }

  /**
   * 各種ボタンを初期化
   */
  function initSettingButton() {
    const removeButton = document.getElementById('remove');
    removeButton.addEventListener('click', remove);
    const confirmButton = document.getElementById('confirm');
    confirmButton.addEventListener('click', confirm);
    const saveButton = document.getElementById('save');
    saveButton.classList.add('disable');
  }

  /**
   * Removeボタン
   */
  function remove () {
    chrome.storage.sync.remove(['shortUrl', 'apiToken'], function() {
      const shortUrl = document.getElementById('short-url');
      const apiToken = document.getElementById('api-token');
      shortUrl.value = '';
      apiToken.value = '';

      const saveButton = document.getElementById('save');
      saveButton.classList.add('disable');
      saveButton.removeEventListener('click', save);
    });
  }

  /**
   * 確認ボタン
   */
  function confirm () {
    const shortUrlForm = document.getElementById('short-url');
    const apiTokenFrom = document.getElementById('api-token');
    let isVerify = true;
    if (shortUrlForm.value === '') {
      shortUrlForm.classList.add('require');
      isVerify = false;
    }
    if (apiTokenFrom.value === '') {
      apiTokenFrom.classList.add('require');
      isVerify = false;
    }
    if (!isVerify) {
      return;
    }

    const longUrl = 'https://www.google.com';
    convertURL(longUrl, shortUrlForm.value, apiTokenFrom.value, function (response) {
      const shortLink = response.shortLink;
      successConfirm(shortLink, shortUrlForm.value, apiTokenFrom.value);
    })
  }

  /**
   * 保存ボタン
   */
  function save () {
    chrome.storage.sync.set({
      shortUrl: successUrl,
      apiToken: successApiToken
    }, function() {
      const balloon = document.getElementById('success-popup');
      balloon.classList.add('balloon1-top-show');
      setTimeout(function() {
        balloon.classList.remove('balloon1-top-show');
        // タブを削除
        chrome.tabs.getCurrent(function (tab) {
          chrome.tabs.remove(tab.id)
        });
      }, 1000);
    });
  }

  /**
   * URL変換
   * @param longURL
   * @param shortUrl
   * @param apiToken
   * @param isConfirm
   */
  function convertURL (longURL, shortUrl, apiToken, successCallback) {
    if (shortUrl === '' || apiToken === '') {
      return
    }

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
        successCallback(response);
      },
      error: function(response){
        const result = document.getElementById('confirm-result');
        result.innerHTML = '<div>ERROR!!</div><div>Check the Domain and API Key</div>';
        console.error(response);
      }
    });
  }

  /**
   * 確認成功時のアクション
   * @param shortLink
   * @param shortUrl
   * @param apiToken
   */
  function successConfirm (shortLink, shortUrl, apiToken) {
    const result = document.getElementById('confirm-result');
    result.innerHTML = '<div>SUCCESS!!</div><div>https://www.google.com</div><div>↓</div>';
    const a = document.createElement('a');
    a.innerText = shortLink;
    a.setAttribute('href', shortLink);
    a.setAttribute('target', '_blank');
    result.appendChild(a);

    successUrl = shortUrl;
    successApiToken = apiToken;

    const saveButton = document.getElementById('save');
    saveButton.removeEventListener('click', save);
    saveButton.addEventListener('click', save);
    saveButton.classList.remove('disable');
  }

})();

