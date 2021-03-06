// Separate from JSON/YAML format
// be the indie style
const fh = require("filehound");
const fsx = require("fs-extra");
const jsyaml = require("js-yaml");
const path = require("path");
const mkdirp = require("mkdirp");
const moment = require("moment");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const pug = require("pug");
const os = require("os");
const fs = require("fs");

const template_api = require('./template');
const utils = require('./utils');
const compile_engine_md = {};

function nested_toc(content,depth){
    let tabs="",toc="";
    toc+="<ol>";
    /*for(var i=0;i<hx_tags.length;i++){
        // create toc 
        toc+="<li><a href=#"+hx_tags[i].innerHTML.replace(" ","%20")+">"+hx_tags[i].innerHTML+"</li>\n";
        if(depth!=3)
            toc+=nested_toc(content,depth+1);
    }*/
    let headings = [].slice.call(content.querySelectorAll('h1, h2, h3'));
    headings.forEach(function(element){
        //console.log(element.tagName[1]);
        if(parseInt(element.tagName[1])>depth){
            toc+="<ol>";
            // append real
            toc+="<li><a href=#"+element.innerHTML.replace(" ","%20")+">"+element.innerHTML+"</li>\n";
            depth=parseInt(element.tagName[1]);
        }
        else if(parseInt(element.tagName[1])<depth){
            toc+="</ol>";
            toc+="<li><a href=#"+element.innerHTML.replace(" ","%20")+">"+element.innerHTML+"</li>\n";
            depth=parseInt(element.tagName[1]);
        }
        else if(parseInt(element.tagName[1])==depth){
            toc+="<li><a href=#"+element.innerHTML.replace(" ","%20")+">"+element.innerHTML+"</li>\n";
        }
    });
    toc+="</ol>";
    return toc;
}

// Generating TOC table for own use
compile_engine_md.gen_toc = function(dom){
    // Parsing dom tree, and pack all available dom tree
    let contents = dom.window.document.getElementsByClassName("content");
    // Build Table of content , per content.
    for(var c=0;c<contents.length;c++){
        // Step 1: Get h1 tag , pack into js object, and modify it
        let toc="<h4 class=\"modal-text\">"+dom.window.document.getElementById("label_tab"+(c+1)).textContent+"</h4><hr>";
        // let h1_tags=dom.window.document.getElementsByTagName("H1");
        toc+=nested_toc(contents[c],1);
        // Step 2: construct toc table
        let toc_dom = JSDOM.fragment(toc);
        dom.window.document.getElementById("toc").appendChild(toc_dom);
    }
    
    // Enable TOC, replace all tags (Global)
    // Enable Chinese title, Patch up for chinese title
    for(let i=0;i<dom.window.document.getElementsByTagName("H1").length;i++){
        // TOC 
        dom.window.document.getElementsByTagName("H1")[i].setAttribute("id",dom.window.document.getElementsByTagName("H1")[i].innerHTML.replace(" ","%20"));
        // chinese title support
        if(dom.window.document.getElementsByTagName("H1")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H1")[i].className;
            dom.window.document.getElementsByTagName("H1")[i].setAttribute("class",oldClass+" cn");
        }
    }
    for(let i=0;i<dom.window.document.getElementsByTagName("H2").length;i++){
        // TOC
        dom.window.document.getElementsByTagName("H2")[i].setAttribute("id",dom.window.document.getElementsByTagName("H2")[i].innerHTML.replace(" ","%20"));
        // chinese title support
        if(dom.window.document.getElementsByTagName("H2")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H2")[i].className;
            dom.window.document.getElementsByTagName("H2")[i].setAttribute("class",oldClass+" cn");
        }
    }
    for(let i=0;i<dom.window.document.getElementsByTagName("H3").length;i++){
        // TOC
        dom.window.document.getElementsByTagName("H3")[i].setAttribute("id",dom.window.document.getElementsByTagName("H3")[i].innerHTML.replace(" ","%20"));
        // chinese title support
        if(dom.window.document.getElementsByTagName("H3")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H3")[i].className;
            dom.window.document.getElementsByTagName("H3")[i].setAttribute("class",oldClass+" cn");
        }
    }
    // h4~h6, no need to create TOC
    for(let i=0;i<dom.window.document.getElementsByTagName("H4").length;i++){
        // chinese title support
        if(dom.window.document.getElementsByTagName("H4")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H4")[i].className;
            dom.window.document.getElementsByTagName("H4")[i].setAttribute("class",oldClass+" cn");
        }
    }
    for(let i=0;i<dom.window.document.getElementsByTagName("H5").length;i++){
        // chinese title support
        if(dom.window.document.getElementsByTagName("H5")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H5")[i].className;
            dom.window.document.getElementsByTagName("H5")[i].setAttribute("class",oldClass+" cn");
        }
    }
    for(let i=0;i<dom.window.document.getElementsByTagName("H6").length;i++){
        // chinese title support
        if(dom.window.document.getElementsByTagName("H6")[i].innerHTML.match(/[\u3400-\u9FBF]/)){
            let oldClass=dom.window.document.getElementsByTagName("H6")[i].className;
            dom.window.document.getElementsByTagName("H6")[i].setAttribute("class",oldClass+" cn");
        }
    }

    // return dom tree 
    return dom;
}

compile_engine_md.gen_doc_md = function(src_path,title,out_path,theme){
    // fetch and generate
    const files = fh.create().paths(src_path).ext('md').find((err,files) => {
        if(err)
            return;
        else{
            // strip out the files under node_modules
            for(var index=0;;index++){
                if(files[index] == undefined) break;
                if(files[index].indexOf('node_modules') != -1){
                    files.splice(index,1);
                    index--;
                }
            }
            // list out existed -> files 
            console.log("After exclude useless md:")
            console.dir(files);
            let fnamelist = utils.fetch(files,"md");
            // copy the buffer to dest
            utils.write_buffer(out_path);
            // read file content and pack together
            // let result = template_api.md_doc()({ title: title, namelist: fnamelist, theme: theme});
            let result = template_api.template("md_doc")({ title: title, namelist: fnamelist, theme: theme});
            // Add on feature
            let dom = new JSDOM(result);
            // TOC 
            dom = this.gen_toc(dom);
            result = dom.serialize();
            // console.log(dom.window.document.getElementsByTagName("H1")[0].innerHTML);
            // success
            console.log(`Successfully compile/render target pug files. Ready to output.`);
            // Write file 
            mkdirp(out_path,function(err){
                if(err){
                    console.error("mkdirp error!");
                    return;
                }
                else{
                    // write file to dest
                    console.log(`Result html: ${path.join(out_path,'index.html')}`);
                    fs.writeFileSync(path.join(out_path,'index.html'),result,{encoding: 'utf-8', flag: 'w'});
                    // copy asset to dest
                    console.log(`Source asset path: ${path.join(__dirname,'asset')}`);
                    console.log(`Output asset path: ${path.join(out_path,'asset')}`);
                    fsx.copySync(path.join(__dirname,'asset'),path.join(out_path,'asset'));
                }
            })
        }
    });
}

module.exports = compile_engine_md;