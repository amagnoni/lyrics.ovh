'use strict';

var searchInput = $('#search-input');
var results = $('#results');
var apiUrl = 'http://localhost:8080';
var lyricsDiv = $('#lyrics');
var timeoutSuggest;

lyricsDiv.hide();

searchInput.on('input', function() {
  if (timeoutSuggest) {
    clearTimeout(timeoutSuggest);
  }
  timeoutSuggest = setTimeout(suggestions, 300);
});

function removeResults() {
  $('.result').remove();
}

function suggestions() {
  var term = searchInput.val();
  if (!term) {
    removeResults();
    return;
  }
  console.log("Search suggestions for", term);
  
  $.ajax({
    url: apiUrl + '/suggest/' + encodeURIComponent(term),
    method: 'GET',
    timeout: 10000,
    success: function(data) {
      removeResults();
      var finalResults = [];
      var seenResults = [];
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(function (result) {
          if (seenResults.length >= 5) {
            return;
          }
          var t = result.title + ' - ' + result.artist.name;
          if (seenResults.indexOf(t) >= 0) {
            return;
          }
          seenResults.push(t);
          finalResults.push({
            display: t,
            artist: result.artist.name,
            title: result.title
          });
        });

        var l = finalResults.length;
        finalResults.forEach(function (result, i) {
          var c = 'result';
          if (i == l-1) {
            c += ' result-last'
          }
          var e = $('<li class="' + c + '">' + result.display + '</li>');
          results.append(e);
          e.click(function () {
            songLyrics(result);
          });
        });
      }
    },
    error: function(xhr, status, error) {
      console.log("Search suggestions failed:", error);
      removeResults();
    }
  });
}

function songLyrics(song) {
  console.log("Search lyrics for", song);
  removeResults();
  lyricsDiv.slideUp();
  
  $.ajax({
    url: apiUrl + '/v1/' + encodeURIComponent(song.artist) + '/' + encodeURIComponent(song.title),
    method: 'GET',
    timeout: 20000, // Increased timeout for lyrics search
    success: function(data) {
      var html = '<h3 class="lyrics-title">' + song.display + '</h3>';
      html += '<div class="copy-lyrics" id="copy-lyrics" data-clipboard-target="#thelyrics">Copy the lyrics <span id="copy-ok"></span></div>';
      html += '<div id="thelyrics">' + data.lyrics.replace(/\n/g, '<br />') + '</div>';
      lyricsDiv.html(html);
      lyricsDiv.slideDown();
      
      // Initialize clipboard functionality
      var copyl = new ClipboardJS('#copy-lyrics');
      copyl.on('success', function(e) {
        e.clearSelection();
        $('#copy-ok').text(' - Done :-)');
        setTimeout(function() {
          $('#copy-ok').text('');
        }, 3000);
      });
    },
    error: function(xhr, status, error) {
      console.log("Lyrics fetch failed:", error);
      var html = '<h3 class="lyrics-title">' + song.display + '</h3>';
      html += '<div class="error-message">Sorry, lyrics not found for this song. Please try another song.</div>';
      lyricsDiv.html(html);
      lyricsDiv.slideDown();
    }
  });
}

// Hide the link for Chrome extension if not using Chrome
var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

if(!isIOSChrome && !(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false)) {
  $('#dl-chrome-ext').hide();
}