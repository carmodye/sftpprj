/*
 * Copyright 2011-2022 Abierto Networks, LLC.
 * All rights reserved.
 */

/* global _ */

import * as APPUI from '../../../js/modules/appui.js';
import CONSTANTS from '../../../js/modules/constants.js';

const APP_UI = (function() {
    const APPID = $('#id').val();
    const USERROLE = parseInt($('#userrole').val());
    const PAGE = $('#apps-edit-page-body');
    const CONFIG = {
        maxAlerts: 3,
        maxMessages: 3,
        questions: [
            'Would you like to keep seeing content similar to this?',
            '',
            ''
        ],
        storeData: [
            'Anniversaries',
            'Birthdays',
            'Sales Goals / F&B 50k',
            'Extra Page (SFTK)', // extra page under My Store, normally SFTK
            'Extra Slide (SheetzFest)' // extra slide on home page slideshow, normally SheetzFest
        ]
    };

    function init() {
        renderTabs();
        moveTabs();
        bindEvents();
        getMetaData(loadMetaData);
    }

    function renderTabs() {
        let text = '<div id="apptabs">';

        text += '<ul>';
        text += '<li><a href="#playlists">Playlist</a></li>';
        text += '<li><a href="#survey">Questions</a></li>';

        // only show "Store Data" and "Messages & Alerts" tabs to ROOT user
        if (USERROLE === CONSTANTS.USERROLE_ROOT) {
            text += '<li><a href="#store-data">Store Data</a></li>';
            text += '<li><a href="#messages">Messages</a></li>';
        }

        text += '</ul>';
        text += renderPlaylistsTab();
        text += renderSurveyTab();

        // only show "Store Data" and "Messages & Alerts" tabs to ROOT user
        if (USERROLE === CONSTANTS.USERROLE_ROOT) {
            text += renderStoreDataTab();
            text += renderMessagesTab();
        }

        text += '</div>';

        PAGE.append(text);
        // initialize tabs
        $('#apptabs').tabs({ heightStyle: 'auto' });
    }

    function renderPlaylistsTab() {
        const text = '<div id="playlists"></div>';

        return text;
    }

    function renderStoreDataTab() {
        let text = '<table width="100%">';

        text += '<thead>';
        text += '<tr class="header">';
        text += '<td width="25%"></td>';
        text += '<td width="75%"></td>';
        text += '</tr>';
        text += '</thead>';
        text += '<tbody>';

        _.forEach(CONFIG.storeData, (item, i) => {
            const index = i + 1;

            text += '<tr id="store-data-' + index + '">';
            text += '<td class="data-preview">' + item + '</td>';
            text += '<td class="data-upload">';
            text += '<div class="form-div">';
            text += '<input type="file" name="data' + index + '" id="data' + index + '" class="data">';
            text += '</div>';
            text += '</td>';
            text += '</tr>';
        });

        text += '</tbody>';
        text += '</table>';

        // button row
        text += '<div class="button-wrapper"><button id="uploadstoredata" class="button disabled">Upload</button></div>';
        text += '<div id="store-data-mb1"></div>';

        text += '<table width="100%">';

        text += '<thead>';
        text += '<tr class="header">';
        text += '<td width="25%"></td>';
        text += '<td width="75%"></td>';
        text += '</tr>';
        text += '</thead>';
        text += '<tbody>';

        _.forEach(CONFIG.storeData, (item, i) => {
            const index = i + 1;

            if (index === 4 || index === 5) {
                text += '<tr class="enablerow">';
                text += '<td class="data-preview">' + item + '</td>';
                text += '<td class="data-upload">';
                text += '<div class="form-div">';
                text += '<input type="checkbox" name="enable' + index + '" class="enable"> Enable/Disable';
                text += '</div>';
                text += '</td>';
                text += '</tr>';
            }
        });

        text += '</tbody>';
        text += '</table>';

        text += '<div class="button-wrapper"><button id="saveextras" class="button disabled">Save</button></div>';
        text += '<div id="store-data-mb2"></div>';

        return $('<div id="store-data">').append(text)[0].outerHTML;
    }

    function renderSurveyTab() {
        let text = '<table width="100%">';

        text += '<thead>';
        text += '<tr>';
        text += '<td width="10%"></td>';
        text += '<td width="45%"></td>';
        text += '<td width="45%"></td>';
        text += '</tr>';
        text += '</thead>';
        text += '<tbody>';

        _.forEach(CONFIG.questions, (item, i) => {
            const index = i + 1;
            const name = 'question' + index;
            let disabled = '';

            if (index === 1) {
                disabled = 'disabled="disabled"';
            }

            text += '<tr>';
            text += '<td>Question ' + index + ':</td>';
            text += '<td><div class="form-div">';
            text += '<input type="text" name="' + name + '" id="' + name + '" class="question"' + disabled + ' value="' + item + '">';
            text += '</div></td>';
            text += '<td>&nbsp;</td>';
            text += '</tr>';
        });

        text += '</tbody>';
        text += '</table>';

        const uploadButton = '<div class="button-wrapper"><button id="savequestions" class="button disabled">Save</button></div>';

        return $('<div id="survey">').append(text, uploadButton)[0].outerHTML;
    }

    function renderMessagesTab() {
        let text = '<table width="100%">';

        text += '<thead>';
        text += '<tr>';
        text += '<td width="10%"></td>';
        text += '<td width="45%">Message Text</td>';
        text += '<td width="45%"><div style="margin-left: 10px;">Display Until</div></td>';
        text += '</tr>';
        text += '</thead>';
        text += '<tbody>';

        for (var i = 1; i <= CONFIG.maxMessages; i++) {
            const name = 'message' + i;

            text += '<tr>';
            text += '<td>Message ' + i + ':</td>';
            text += '<td><div class="form-div">';
            text += '<input type="text" name="' + name + '" id="' + name + '" class="message" value="">';
            text += '</div></td>';
            text += '<td><div class="form-div"><input type="text" name="date' + name + '" class="date" value=""></div></td>';
            text += '</tr>';
        }

        text += '</tbody>';
        text += '</table>';

        const uploadButton = '<div class="button-wrapper"><button id="savemessages" class="button disabled">Save</button></div>';

        return $('<div id="messages">').append(text, uploadButton)[0].outerHTML;
    }

    // Waits for daypart-tabs to be rendered on the page
    // then moves it into the playlists tab
    function moveTabs() {
        // Create an observer instance linked to a callback function
        const observer = new MutationObserver(mutationsList => {
            for (const mutation of mutationsList) {
                const id = $(mutation.target).prop('id');

                if (id === 'daypart-tabs') {
                    // move daypart tabs into playlists tab
                    $('#playlists').append($('#daypart-tabs'));
                }
                else if (id.startsWith('daypart-list-')) {
                    hideVideos();
                }
            }
        });

        // Start observing the target node for configured mutations
        observer.observe(PAGE[0], {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    function hideVideos() {
        if ($('.slidelist li').length) {
            _.forEach($('.slidelist li'), li => {
                let data = JSON.parse(JSON.parse($(li).data('slide')));

                if (data.type === 'file' && data.name.split('.').pop() === 'mp4') {
                    $(li).hide();
                }
            });
        }
    }

    function bindEvents() {
        // file upload fields on store data tab
        $('.data').on('change', onFileChange('uploadstoredata'));
        // enable/disable checkboxes on store data tab
        $('#store-data input.enable').on('click', onEnableExtras);
        // upload button on store data tab
        $('#uploadstoredata').on('click', onUploadStoreData);
        // save button on store data tab
        $('#saveextras').on('click', onSaveExtras);
        // question input fields on survey tab
        $('.question').on('change keyup', onTextInputChange('savequestions'));
        // save button on survey tab
        $('#savequestions').on('click', onSaveQuestions);
        // message input fields on messages tab
        $('.message').on('change keyup', onTextInputChange('savemessages'));
        // alert input fields on messages tab
        $('.alert').on('change keyup', onTextInputChange('savemessages'));
        // message/alert date fields on messages tab
        $('.date').on('change', onTextInputChange('savemessages'));
        // save button on messages tab
        $('#savemessages').on('click', onSaveMessages);
        // cancel checkboxes on messages tab
        $('#messages input.cancel').on('click', onCancelAlert);
        // datepickers on messages tab
        $('.date').datepicker().datepicker('option', 'maxDate', '+3w');
        // bind on location change event
        $('select[name="location"]').on('change', function() {
            hideVideos();
            $('.message').val('');
            $('.form-div .date').val('');
            getMetaData(loadMetaData);
        });
    }

    // display "text" in a message box appended to container
    function messageBox(container, text) {
        let messageBox = $(`#${container} .messagebox`).empty();

        if (!messageBox.length) {
            messageBox = $('<div class="messagebox">');

            $(`#${container}`).append(messageBox);
        }

        messageBox.append($('<p>').append(text));
    }

    // store data and videos on change function
    function onFileChange(buttonId) {
        return function(e) {
            const files = _.get(e, 'originalEvent.target.files', []);

            // enable or disable upload button
            if (files.length) {
                $(`#${buttonId}`).removeClass('disabled');
            }
            else {
                $(`#${buttonId}`).addClass('disabled');
            }
        };
    }

    // questions on change function
    function onTextInputChange(buttonId) {
        return function(e) {
            const text = $(e.target).val();

            if (text.length) {
                $(`#${buttonId}`).removeClass('disabled');
            }
            else {
                $(`#${buttonId}`).addClass('disabled');
            }
        };
    }

    // handler for enable/disable checkboxes for extra page and extra slide
    function onEnableExtras() {
        const checkboxes = $('#store-data .enable');
        let checked = false;

        _.forEach(checkboxes, checkbox => {
            const originalvalue = $(checkbox).data('originalvalue');
            const currentvalue = $(checkbox).is(':checked').toString();

            if (originalvalue !== currentvalue) {
                checked = true;
            }
        });

        if (checked) {
            $('#saveextras').removeClass('disabled');
        }
        else {
            $('#saveextras').addClass('disabled');
        }
    }

    // questions on change function
    function onCancelAlert() {
        const checkboxes = $('#messages .cancel');
        let checked = false;

        _.forEach(checkboxes, checkbox => {
            if ($(checkbox).is(':checked')) {
                checked = true;
            }
        });

        if (checked) {
            $('#savemessages').removeClass('disabled');
        }
        else {
            $('#savemessages').addClass('disabled');
        }
    }

    // on upload store data click
    function onUploadStoreData() {
        const formData = new FormData();
        let count = 0;

        // loop through each data field
        _.forEach($('.data'), item => {
            // loop through each file
            _.forEach(item.files, file => {
                // make sure file is csv
                if (file.name.endsWith('.csv')) {
                    // append file to form data and update count
                    formData.append('fields[]', item.id);
                    formData.append('files[]', file);
                    count++;
                }
            });
        });

        // if there is at least 1 file, upload it
        if (count > 0) {
            uploadStoreData(formData, rsp => {
                if (rsp && rsp.length) {
                    $('#uploadstoredata').addClass('disabled');

                    messageBox('store-data-mb1', 'Files: ' + rsp.join(', ') + ' uploaded successfully.');
                }
                else {
                    messageBox('store-data-mb1', 'Error uploading files, please try again.');
                }
            });
        }
        else {
            messageBox('store-data-mb1', 'Please select at least 1 store data (.csv) file to upload.');
        }

        // clear data fields
        $('.data').val('');
    }

    // uploads store data files (.csv) to server via /apps/uploadstoredata
    function uploadStoreData(data, cb) {
        const url = '/apps/uploadstoredata';

        data.append('api', 3);
        data.append('appid', APPID);

        $.ajax({
            type: 'post',
            url: url,
            cache: false,
            data: data,
            contentType: false,
            processData: false,
            success: function(response) {
                cb(response);
            },
            error: function(request, status, error) {
                console.log(request, status, error);
                cb();
            }
        });
    }

    function onSaveExtras() {
        // check values of enable4 and enable5
        const enable4 = $('input[name="enable4"]').is(':checked');
        const enable5 = $('input[name="enable5"]').is(':checked');
        const formData = {};

        formData.api = 3;
        formData.appid = APPID;
        formData.data = [enable4, enable5];

        saveExtras(formData, rsp => {
            if (rsp) {
                // reload extras to update original state
                loadExtras({ extras: rsp[0] });

                $('#saveextras').addClass('disabled');

                messageBox('store-data-mb2', 'Data files: enabled/disabled successfully.');
            }
            else {
                messageBox('store-data-mb2', 'Error enabling/disabling data files, please try again.');
            }
        });
    }

    function saveExtras(data, cb) {
        const url = '/apps/saveextras';

        $.ajax({
            type: 'get',
            url: url,
            cache: false,
            data: data,
            success: function(response) {
                cb(response);
            },
            error: function(request, status, error) {
                console.log(request, status, error);
                cb();
            }
        });
    }

    // get UI meta data
    function getMetaData(cb) {
        const url = '/apps/meta';
        const { type, id } = APPUI.getLocation();
        const data = {
            api: 3,
            appid: APPID
        };

        // it's possible id isn't set yet, if so, wait and call getMetaData again
        if (!id) {
            setTimeout(() => {
                getMetaData(cb);
                return;
            }, 100);
        }
        else {
            data[type] = id;

            $.ajax({
                type: 'get',
                url: url,
                cache: false,
                data: data,
                success: function(response) {
                    cb(response);
                },
                error: function(request, status, error) {
                    console.log(request, status, error);
                    cb();
                }
            });
        }
    }

    function loadMetaData(data) {
        loadQuestions(data);
        loadMessages(data);
        loadAlerts(data);
        loadExtras(data);
    }

    function loadQuestions(data) {
        const questions = _.get(data, 'questions', []);

        _.forEach(questions, question => {
            const id = '#question' + question.id;

            $(id).val(question.text);
        });
    }

    function loadMessages(data) {
        const messages = _.get(data, 'messages', []);

        _.forEach(messages, (message, index) => {
            const name = `message${index + 1}`;
            const displayUntil = message.displayUntil;

            $(`#${name}`).val(message.message);
            $(`input[name="date${name}"]`).datepicker('setDate', displayUntil);
        });
    }

    function loadAlerts(data) {
        const alerts = _.get(data, 'alerts', []);

        _.forEach(alerts, (alert, index) => {
            const name = `alert${index + 1}`;
            const displayUntil = alert.displayUntil;

            $(`#${name}`).val(JSON.stringify(alert));
            $(`input[name="date${name}"]`).datepicker('setDate', displayUntil);
        });
    }

    function loadExtras(data) {
        const extras = _.get(data, 'extras', []);

        // if there are no extras, default originalvalue to false
        if (!extras.length) {
            $('input[name="enable4"]').data('originalvalue', 'false');
            $('input[name="enable5"]').data('originalvalue', 'false');
        }

        _.forEach(extras, (extra, index) => {
            const name = `enable${index + 4}`;

            $(`input[name="${name}"]`).data('originalvalue', extra);

            if (extra === 'true') {
                $(`input[name="${name}"]`).prop('checked', true);
            }
            else {
                $(`input[name="${name}"]`).prop('checked', false);
            }
        });
    }

    function reloadMessages() {
        $('.message').val('');
        $('.alert').val('');
        $('.date').val('');
        $('.cancel').prop('checked', false);
        $('.messagebox').remove();
        $('#savemessages').addClass('disabled');

        getMetaData(data => {
            loadMessages(data);
            loadAlerts(data);
        });
    }

    function onSaveQuestions() {
        if ($(this).hasClass('disabled')) {
            return;
        }

        const formData = new FormData();
        const questions = [];

        // loop through each question field
        _.forEach($('.question'), (item, i) => {
            questions.push({
                id: i + 1,
                text: $(item).val()
            });
        });

        formData.append('questions', JSON.stringify(questions));

        saveQuestions(formData, rsp => {
            if (rsp && rsp.length) {
                $('#savequestions').addClass('disabled');

                messageBox('survey', 'Survey questions updated successfully.');
            }
            else {
                messageBox('survey', 'Error updating survey questions, please try again.');
            }
        });
    }

    // save changes to survey tab
    function saveQuestions(data, cb) {
        const url = '/apps/savequestions';

        data.append('api', 3);
        data.append('appid', APPID);

        $.ajax({
            type: 'post',
            url: url,
            cache: false,
            data: data,
            contentType: false,
            processData: false,
            success: function(response) {
                cb(response);
            },
            error: function(request, status, error) {
                console.log(request, status, error);
                cb();
            }
        });
    }

    function onSaveMessages() {
        if ($(this).hasClass('disabled')) {
            return;
        }

        const formData = new FormData();
        const messages = [];

        const id = $('select[name="location"] :selected').val();

        if ($('select[name="location"] :selected').closest('optgroup').prop('label') === 'Groups') {
            formData.append('groupid', id);
        }
        else {
            formData.append('displayid', id);
        }

        // loop through each message field
        _.forEach($('.message'), (item, i) => {
            if ($(item).val()) {
                messages.push({
                    message: $(item).val(),
                    displayUntil: $('#messages table').eq(0).find('.date').eq(i).val()
                });
            }
        });

        formData.append('messages', JSON.stringify(messages));

        const reload = () => {
            setTimeout(reloadMessages, 1000);
        };

        saveMessages(formData, rsp => {
            if (rsp) {
                $('#savemessages').addClass('disabled');

                messageBox('messages', 'Messages updated successfully.');

                reload();
            }
            else {
                messageBox('messages', 'Error updating messages, please try again.');
            }
        });
    }

    // save changes to survey tab
    function saveMessages(data, cb) {
        const url = '/apps/savemessages';

        data.append('api', 3);
        data.append('appid', APPID);

        $.ajax({
            type: 'post',
            url: url,
            cache: false,
            data: data,
            contentType: false,
            processData: false,
            success: function(response) {
                cb(response);
            },
            error: function(request, status, error) {
                console.log(request, status, error);
                cb();
            }
        });
    }

    return {
        init: init
    };

})();

$(document).ready(APP_UI.init);
