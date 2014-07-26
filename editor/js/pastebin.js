function Pastebin() {

}

Pastebin.paste = function(code, cb) {
    simplePost('eb/paste/make/', { 'code': code }, cb);
}

Pastebin.load = function(key, cb) {
    simpleGet('eb/paste/get/' + encodeURIComponent(key) + '/', '', cb);
}

function PasteControlsController(pasteControls, shareDialogWrapper, editor, notificationSystem) {
    this.pasteControls = $(pasteControls);
    this.shareButton = $('.share', pasteControls);
    this.shareDialogWrapper = $(shareDialogWrapper);
    this.shareLinkInput = $('.share-link', shareDialogWrapper);

    var me = this;

    var hash = window.location.hash.substring(1);
    if(hash !== '') {
        Pastebin.load(hash, function(data) {
            if(data['result'] === 'success') {
                editor.setCode(data['code']);
            } else {
                notificationSystem.showErrors(data['errors']);
            }
        });
    }

    this.shareButton.click(function(e) {
        Pastebin.paste(editor.getCode(), function(data) {
            if(data['result'] === 'success') {
                me.shareDialogWrapper.show();
                me.shareLinkInput.val('http://eppabasic.fi/#' + data['key']);
            } else {
                notificationSystem.showErrors(data['errors']);
            }
        });
    });
}