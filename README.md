# Introduction

**Weber** (German for *weaver*) is a tool for compiling scripts, stylesheets and templates when building Javascript
web applications.

It is heavily based on (and almost the same as) [Hem](https://github.com/maccman/hem), which itself is inspired by
[Bundler](http://gembundler.com/) and [Stitch](https://github.com/sstephenson/stitch). Weber improves upon Hem by
making less assumptions about your app and allowing for more flexibility in terms of what gets built and where.

During the development phase of your project you can use Weber to serve up your compiled scripts and stylesheets on
every request, saving you the work of compiling every change you make to your source files. When it comes times to
push your project into production Weber will generate the final static resources ready to be deployed.

# Installation

    npm install -g weber

# Usage

todo