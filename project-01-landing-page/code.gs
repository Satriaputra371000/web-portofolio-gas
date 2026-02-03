function doGet() {
return HtmlService.createTemplateFromFile('index')
.evaluate()
.setTitle('Personal Landing Page');
}

function include(filename) {
return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
