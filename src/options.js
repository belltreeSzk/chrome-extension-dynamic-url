'use strict';


import './options.css';
import $ from 'jquery';
import QRCode from 'qrcode';
import ClipboardJS from 'clipboard';

import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/brands";
import "@fortawesome/fontawesome-free/js/solid";
import "@fortawesome/fontawesome-free/js/regular";

(function() {
  let successUrl = '';
  let successApiToken = '';
  function main () {
    // const shortUrl = 'https://belz.page.link';
    // const apiToken = 'AIzaSyAhkyup4RMDpDx5Q3vejLx2IVn90hYo81Q';

    const shortUrl = localStorage.shortUrl;
    const apiToken = localStorage.apiToken;

    console.log(shortUrl);
    console.log(apiToken);
    initSettingButton();
  }

  function convertURL (longURL, shortUrl, apiToken, isConfirm = false) {

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
        if (isConfirm) {
          const shortLink = response.shortLink;
          successConfirm(shortLink, shortUrl, apiToken);
        } else {
          const shortLink = response.shortLink;
          generateQRCode(shortLink);
          const url = document.getElementById('url');
          url.innerText = shortLink;
          url.setAttribute('href', shortLink);
        }
      },
      error: function(response){
        console.log(response);
        errorPreview();
      },
      complete: function (response) {
        console.log('complete')
      }
    });
  }



  function generateQRCode (shortUrl) {
    const canvas = document.getElementById('canvas')
    QRCode.toCanvas(canvas, shortUrl, function (error) {
      if (error) {
        console.error(error)
      }
      console.log('success!');
    });
  }

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

  function initSettingButton() {
    const confirmButton = document.getElementById('confirm');
    confirmButton.addEventListener('click', confirm);
    const saveButton = document.getElementById('save');
    saveButton.classList.add('disable');
  }

  function confirm () {
    const shortUrl = document.getElementById('short-url');
    const apiToken = document.getElementById('api-token');

    console.log(shortUrl.value);
    console.log(apiToken.value);

    const longUrl = 'https://www.google.com';
    convertURL(longUrl, shortUrl.value, apiToken.value, true)
  }

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

  function save () {
    console.log('save');
    localStorage.shortUrl = successUrl;
    localStorage.apiToken = successApiToken;

    chrome.storage.local.set({
      shortUrl: successUrl,
      apiToken: successApiToken
    }, function() {
      const balloon = document.getElementById('success-popup');
      balloon.classList.add('balloon1-top-show');
      setTimeout(function() {
        balloon.classList.remove('balloon1-top-show');
      }, 1500);
    });
  }
  main();
})();

