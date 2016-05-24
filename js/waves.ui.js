/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/jquery.growl.js}
 * @depends {3rdparty/clipboard.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    Waves.balance  = 0;
    Waves.hasLocalStorage = false;
    Waves.update = "Dashboard";

    Waves.pages = {
        'dashboard': function updateDashboard () {
            console.log('Update Dashboard');
        },
        'history': function updateHistory () {
            console.log('Update History');
        },
        'messages': 'messages'
    };

    Waves.updateDOM = function (page) {

       if (Waves.pages[page]) {
            Waves.pages[page]();
        }
    }

    // Show/hide different sections on tab activation
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        switch(linkType) {
            case 'mBB-portfolio':
                Waves.loadPayment();
            break;
        }
    });

    //Import Waves Account

    $("#import_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#ImportAccHeader").show();
        $("#AccHeader").hide();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();
        $("#walletSeed").val('');
        $("#publicKeyLockscreen").html('');
        $("#privateKeyLockscreen").html('');
        $("#addresLockscreen").html('');

    });

    //Create new Waves Acount
    $("#create_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#generateKeys").hide();
        $("#account_divider").hide();
        $("#AccHeader").hide();
        $("#NewAccHeader").show();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();
        $("#login-wPop-new").modal("show");

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        $("#walletSeed").val(passphrase);

        var publicKey = Waves.getPublicKey(passphrase);
        var privateKey = Waves.getPrivateKey(passphrase);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);

        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });

    });


    $("#generateKeys").on("click", function(e) {
        e.preventDefault();

        var walletSeed = $("#walletSeed").val();

        var publicKey = Waves.getPublicKey(walletSeed);
        var privateKey = Waves.getPrivateKey(walletSeed);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);
        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });


    });

    $("#generateRandomSeed").on("click", function(e) {
        e.preventDefault();

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        $("#walletSeed").val(passphrase);

        var publicKey = Waves.getPublicKey(passphrase);
        var privateKey = Waves.getPrivateKey(passphrase);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);
        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });
    });

    $("#registerSeed").on("click", function(e) {
        e.preventDefault();

        var passphrase = $("#walletSeed").val();
        var publicKey = $("#publicKeyLockscreen").html();
        var privateKey = $("#privateKeyLockscreen").html();
        var address = $("#addresLockscreen").html();
        var name = $("#walletName").val();
        var password = $("#walletPassword").val();
        var passwordConfirm = $("#walletPasswordConfirm").val();

        if(password !== passwordConfirm) {
            $("#errorRegister").html('Your passwords do not match.');
            return;
        }

        var cipher = Waves.encryptWalletSeed(passphrase, password).toString();
        var checksum = converters.byteArrayToHexString(Waves.simpleHash(converters.stringToByteArray(passphrase)));

        
        var accountData = {
            name: name,
            cipher: cipher,
            checksum: checksum,
            publicKey: publicKey,
            address: address
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesAccounts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.accounts.push(accountData);
                localStorage.setItem('WavesAccounts', JSON.stringify(currentAccounts));
                $("#wavesAccounts").append('<br><b>'+accountData.name+'</b> '+accountData.address);

            } else {
                var accountArray = { accounts: [accountData] };
                localStorage.setItem('WavesAccounts', JSON.stringify(accountArray));
                $("#wavesAccounts").append('<br><b>'+accountData.name+'</b>'+accountData.address);
            }

        }

        accountData.firstTime = true;
        accountData.password = password;
        accountData.passphrase = passphrase;
        passphrase = '';

        Waves.login(accountData);
        
    });

    
    $("#wavessend").on("click", function(e) {
        e.preventDefault();

        $("#errorpayment").html('');
        var maxSend = $("#wavesbalance").val() - 0.000000001;
        var sendAmount = $("#wavessendamount").val().replace(/\s+/g, '');

        if(sendAmount > maxSend) {

            $("#errorpayment").html('Not enough funds');
            return;

        }

        
        var amount = Math.round(Number(sendAmount * 100000000));

        var senderPassphrase = converters.stringToByteArray(Waves.passphrase);
        var senderPublic = Base58.decode(Waves.publicKey);
        var senderPrivate = Base58.decode(Waves.privateKey);
        var recipient = $("#wavesrecipient").val().replace(/\s+/g, '');

        var wavesTime = Number(Waves.getTime());

        var signature;
        var fee = Number(1);

        var signatureData = Waves.signatureData(Waves.publicKey, recipient, amount, fee, wavesTime);
        console.log(signatureData);

        var signature = Array.from(Waves.curve25519.sign(senderPrivate, signatureData));
        console.log(signature);
        signature = Base58.encode(signature);

        var verify = Waves.curve25519.verify(senderPublic, signatureData, Base58.decode(signature));
        console.log(verify);

        var data = {
          "recipient": recipient,
          "timestamp": wavesTime,
          "signature": signature,
          "amount": amount,
          "senderPublicKey": Waves.publicKey,
          "fee": fee
        }

        
        Waves.apiRequest(Waves.api.waves.broadcastTransaction, JSON.stringify(data), function(response) {

            console.log(response);

            $("#sentpayment").html(JSON.stringify(data));

            $("#errorpayment").html(JSON.stringify(response));

        });

    });

    $("#addContact").on("click", function(e) {
        e.preventDefault();

        $("#contactForm").toggle();
    });

    $("#addContactSubmit").on("click", function(e) {
        e.preventDefault();

        var name = $("#contactname").val();
        var address = $("#contactaddress").val();
        var email = $("#contactemail").val();

        var accountData = {
            name: name,
            address: address,
            email: email
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesContacts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.contacts.push(accountData);
                localStorage.setItem('WavesContacts', JSON.stringify(currentAccounts));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);

            } else {

                var accountArray = { contacts: [accountData] };
                localStorage.setItem('WavesContacts', JSON.stringify(accountArray));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);
            }

        }

    });


    $("#tabs-Icons-community").on("click", function(e) {

        var currentAccounts = localStorage.getItem('WavesContacts');
            currentAccounts = JSON.parse(currentAccounts);

        var row;
        $.each(currentAccounts.contacts, function(contactKey, contactData) {
            
            row += Waves.contactRow(contactData);
    
        });

        $("#contactTable").html(row);

    });    

    $('#uiTB-iconset-logout').click(function() {
        Waves.logout();  
    });


    //Add Copy-to-Clipboard to class clipSpan
    var clipboard = new Clipboard('.clipSpan');

    clipboard.on('success', function(e) {
      
         $.growl.notice({ message: "Address successfully copied to clipboard." });

        e.clearSelection();
    });

    clipboard.on('error', function(e) {
         $.growl.warning({ message: "Could not copy address to clipboard." });
    });

    //How to growl:
    /*
      $.growl({ title: "Growl", message: "The kitten is awake!", url: "/kittens" });
      $.growl.error({ message: "The kitten is attacking!" });
      $.growl.notice({ message: "The kitten is cute!" });
      $.growl.warning({ message: "The kitten is ugly!" });
  */

	return Waves;
}(Waves || {}, jQuery));


$(document).ready(function(){

    Waves.initApp();
    $('.tooltip').tooltipster();
    
    $('#tooltipTest').tooltipster({
        content: $('<span><img src="my-image.png" /> <strong>This text is in bold case !</strong></span>')
    });
    
    $('.tooltip-1').tooltipster({
        theme: 'tooltipster-theme1',
        delay: 1000,
        contentAsHTML: true
    });
    
    $('.tooltip-2').tooltipster({
        theme: 'tooltipster-theme2',
        delay: 1000
    });
    
    $('.tooltip-3').tooltipster({
        theme: 'tooltipster-theme3',
        delay: 1000,
        contentAsHTML: true
    });

});







