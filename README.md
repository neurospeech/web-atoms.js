Atoms.js
========
Enterprise Grade JavaScript UI Framework inspired from Flex and Silverlight

![Atoms.js](https://github.com/atoms-js/atoms.js/raw/master/res/atoms-promo.png)

Features
--------
1. Very little JavaScript
2. One Time, One Way and Two Way Bindings
3. Component Object Model
4. One Liner AJAX
5. Powerful State Machine
6. Customizable Templates
7. Ready to use Line of Business Components

Atoms.js (previously known as Web Atoms JS) is inspired from Adobe Flex and Microsoft Silverlight and has very small learning curve. 
The project contains text template defined in Visual Studio C# Project which recreates output JS files and CSS files.

Build Instructions
------------------
Building Atoms.js project is very easy, you need Visual Studio 2012 onwards and you have to just transform all T4 text templates.

Documentation
-------------

<a href="http://atoms.azurewebsites.net/docs/index.html" target="_blank">Hosted Documentation</a>

In order to view documentation with all samples, you can simply run the Visual Studio Project and test each sample along with the documentation.

For non Windows platform, you may have to use Apache or some similar web server to host this project as website and then open it on any browser. Since AJAX is disabled on all browsers while accessing it from file:// URI pattern, simply opening index.html on browser will not be sufficient. You can view all documentation without any problems, but to run samples with AtomPromise, you will need a web server.







