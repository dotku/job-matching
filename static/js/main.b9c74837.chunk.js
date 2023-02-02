(this["webpackJsonpreact-job-matching"]=this["webpackJsonpreact-job-matching"]||[]).push([[0],{69:function(e,t,c){},74:function(e,t,c){},81:function(e,t,c){"use strict";c.r(t);var s=c(6),n=c(44),i=c.n(n),r=(c(69),c(9)),a=(c(82),c.p,c(74),c(25)),l=c(3);function j(e){var t=Object(s.useState)([]),c=Object(r.a)(t,2),n=c[0],i=c[1],j=e.phrase;Object(s.useEffect)((function(){fetch("/react-job-matching/data/talents.json").then((function(e){return e.json()})).then((function(e){return i(e)})).catch((function(e){return console.error(e)}))}),[]);var d=n.filter((function(e){return!j||e.name.match(new RegExp(j,"i"))})).map((function(e,t){return Object(l.jsx)("div",{className:"col-sm-6 col-md-4 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title h5",children:Object(l.jsx)(a.b,{to:"/resume",children:Object(l.jsxs)("div",{className:"d-flex flex-row",children:[Object(l.jsx)("div",{style:{width:"52px",height:"52px",lineHeight:"52px"},className:"bg-secondary text-light rounded-circle d-inline-block",children:Object(l.jsx)("div",{className:"d-flex justify-content-center align-items-center",children:Object(l.jsx)("i",{className:"bi bi-person-fill h2 mb-0",style:{lineHeight:"52px"}})})}),Object(l.jsx)("div",{className:" ms-2",style:{lineHeight:"52px"},children:e.name})]})})}),Object(l.jsx)("div",{className:"card-text",children:Object(l.jsxs)("div",{className:"",children:[Object(l.jsxs)("span",{title:"Year of Experience",children:[e.career_age,"yr(s)"]}),","," ",Object(l.jsx)("span",{title:"Highest Position",children:e.highest_position})]})})]})})},t)}));return d.length?Object(l.jsxs)("div",{children:[Object(l.jsx)(a.b,{to:"talents",children:Object(l.jsx)("h2",{className:"d-inline-block",children:"Candidates"})}),Object(l.jsx)("div",{className:"row",children:d})]}):null}var d=c(0),o=c(41),b=c(4),h=c(46),x=c(24);function O(e){var t=e.children;return e.error?Object(l.jsx)("div",{className:"alert alert-danger",children:"Something goes wrong, please come back later."}):Object(l.jsx)(l.Fragment,{children:t})}var m=Object(h.a)({apiKey:"AIzaSyCEsb8BLbmH-tyI79fKxvx9irl8VVWgVKU",authDomain:"dk-job.firebaseapp.com",projectId:"dk-job",storageBucket:"dk-job.appspot.com",messagingSenderId:"1039321629261",appId:"1:1039321629261:web:e8b67df5b009d517045204",measurementId:"G-ED7TSVRR8D"},"jobApp"),u=Object(x.e)(m);function p(e){var t=e.phrase,c=Object(s.useState)(!0),n=Object(r.a)(c,2),i=n[0],j=n[1],h=Object(s.useState)(null),m=Object(r.a)(h,2),p=m[0],f=m[1],v=Object(s.useState)([]),g=Object(r.a)(v,2),w=g[0],N=g[1];Object(s.useEffect)((function(){function e(){return(e=Object(b.a)(Object(d.a)().mark((function e(){var t,c;return Object(d.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],c=Object(x.a)(u,"job"),e.prev=2,e.next=5,Object(x.d)(c);case 5:e.sent.forEach((function(e){t.push(Object(o.a)({id:e.id},e.data()))})),e.next=13;break;case 9:e.prev=9,e.t0=e.catch(2),console.error(e.t0),f(e.t0);case 13:N(t),j(!1);case 15:case"end":return e.stop()}}),e,null,[[2,9]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[]);var y=w.filter((function(e){return!t||e.title.match(new RegExp(t,"i"))})).map((function(e,t){var c=e.title,s=e.id;return Object(l.jsx)("div",{className:"col-sm-6 col-md-4 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsx)("div",{className:"card-body",children:Object(l.jsx)("div",{className:"card-title h5",children:Object(l.jsx)(a.b,{to:"/job/".concat(s),children:c})})})})},t)}));return y.length?Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Jobs"}),i?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(O,{error:p,children:Object(l.jsx)("div",{className:"row my-3",children:y.length?y:"empty content"})})]}):null}var f=c(14);function v(){var e=Object(f.f)().id,t=Object(s.useState)(null),c=Object(r.a)(t,2),n=c[0],i=c[1],a=Object(s.useState)(!0),j=Object(r.a)(a,2),o=j[0],h=j[1],m=Object(s.useState)(null),p=Object(r.a)(m,2),v=p[0],g=p[1];return Object(s.useEffect)((function(){function t(){return(t=Object(b.a)(Object(d.a)().mark((function t(){var c,s;return Object(d.a)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return c=Object(x.b)(u,"job",e),t.prev=1,t.next=4,Object(x.c)(c);case 4:s=t.sent,g(s.data()),t.next=12;break;case 8:t.prev=8,t.t0=t.catch(1),console.error(t.t0),i(t.t0);case 12:h(!1);case 13:case"end":return t.stop()}}),t,null,[[1,8]])})))).apply(this,arguments)}!function(){t.apply(this,arguments)}()}),[]),o?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(O,{error:n,children:Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:v.title}),Object(l.jsx)("div",{dangerouslySetInnerHTML:{__html:v.content}})]})})}var g=c(90),w=c(49),N=c.n(w),y=Object(g.a)({root:{background:"#333",border:0,boxShadow:"0 3px 5px 2px rgba(255, 105, 135, .3)",color:"white",padding:"30px","& a":{color:"white"}}});function S(e){var t=e.classNames,c=y();return Object(l.jsx)("div",{className:N()("footer",c.root,t),children:Object(l.jsx)("div",{className:"container",children:Object(l.jsxs)("div",{className:"row",children:[Object(l.jsxs)("div",{className:"col-md-3 col-xs-6",children:[Object(l.jsx)("div",{children:"Job Boards"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://hired.com/x/1cebk",children:"Hired"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://woo.io",children:"Woo.io"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.linkedin.com",children:"LinkedIn"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://angel.co",children:"Angel.co"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.indeed.com/",children:"indeed"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.dice.com/",children:"Dice"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3 col-xs-6",children:[Object(l.jsx)("div",{children:"Interview Preperation"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://interviewcake.com",children:"InterviewCake"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.pramp.com/#/",children:"Pramp"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://leetcode.com",children:"LeetCode"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.hackerrank.com",children:"HackerRank"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3",children:[Object(l.jsx)("div",{children:"Agents"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.teksystems.com/en",children:"TEKSystems"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.modis.com/",children:"modis"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://xoriant.com",children:"xoriant"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://www.collabera.com/",children:"Collabera"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://www.infinity-cs.com",children:"Infinity Consulting Solutions"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.ustechsolutions.com/",children:"US Tech Solutions"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3",children:[Object(l.jsx)("div",{children:"Join Us"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:"Welcome to fork and submit pull request."}),Object(l.jsx)("li",{children:"Email me if you want to join the team weijingjaylin(at)gmail.com"})]})]})]})})})}function k(e){var t=e.items,c=e.linkClassNames;return t&&t.length?Object(l.jsx)("ul",{children:t.map((function(e,t){return Object(l.jsx)("li",{children:e.url?Object(l.jsx)("a",{href:e.url,className:N()(c),children:e.title}):e.title},t)}))}):null}var E=[{title:"TEKSystems",url:"https://www.teksystems.com/en"},{title:"modis",url:"https://www.modis.com/"},{title:"xoriant",url:"http://xoriant.com"},{title:"Collabera",url:"http://www.collabera.com/"},{title:"Infinity Consulting Solutions",url:"http://www.infinity-cs.com"},{title:"US Tech Solutions",url:"https://www.ustechsolutions.com/"},{title:"TrustBrain",url:"https://app.usebraintrust.com/r/weijing1/"}];function T(e){var t=e.phrase,c=E.filter((function(e){return!t||e.title.match(new RegExp(t,"i"))}));return c.length?Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Agent Companies"}),Object(l.jsx)(k,{items:c})]}):null}var A="recruiting SAAS",C="candidate pool",I=Object(h.a)({apiKey:"AIzaSyBddjN4Z0RnDW8fu8qwoAZ9oy_pENPm6Fc",authDomain:"dk-corporation.firebaseapp.com",databaseURL:"https://dk-corporation-default-rtdb.firebaseio.com",projectId:"dk-corporation",storageBucket:"dk-corporation.appspot.com",messagingSenderId:"889307756555",appId:"1:889307756555:web:b6a78034f82ed6b9f82f0e",measurementId:"G-BM1VNZNS61"}),D=Object(x.e)(I);function H(e){var t=Object(s.useState)(!0),c=Object(r.a)(t,2),n=c[0],i=c[1],a=Object(s.useState)(null),j=Object(r.a)(a,2),o=j[0],h=j[1],m=Object(s.useState)([]),u=Object(r.a)(m,2),p=u[0],f=u[1],v=e.phrase;Object(s.useEffect)((function(){function e(){return(e=Object(b.a)(Object(d.a)().mark((function e(){var t,c;return Object(d.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],c=Object(x.a)(D,"corporation"),e.prev=2,e.next=5,Object(x.d)(c);case 5:e.sent.forEach((function(e){var c=e.data().tags;c.includes(C)&&c.includes(A)&&t.push(e.data())})),e.next=12;break;case 9:e.prev=9,e.t0=e.catch(2),h(e.t0);case 12:f(t),i(!1);case 14:case"end":return e.stop()}}),e,null,[[2,9]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[]);var g=p.filter((function(e){return!v||e.name.match(new RegExp(v,"i"))})).map((function(e,t){var c=e.name,s=e.url,n=e.candidatesNumber,i=e.jobsNumber;return Object(l.jsx)("div",{className:"col-sm-6 col-md-4 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title h5",children:s?Object(l.jsx)("a",{href:s,children:c}):{name:c}}),Object(l.jsxs)("div",{className:"card-text",children:[n&&Object(l.jsxs)("div",{title:"candidate number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Candidates:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(n)]}),i&&Object(l.jsxs)("div",{title:"candidate number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Jobs:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(i)]})]})]})})},t)}));return Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Job Boards"}),n?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(O,{error:o,children:Object(l.jsx)("div",{className:"row my-3",children:g.length?g:"empty content"})})]})}function M(e){return Object(l.jsx)("input",{className:"form-control",value:e.phrase,onChange:e.onChange,placeholder:"Search"})}function R(e){var t=e.phrase,c=e.handlePhraseChange;return Object(l.jsxs)("div",{className:"header d-flex justify-content-between align-items-center",children:[Object(l.jsx)(a.b,{to:"/",children:Object(l.jsx)("h1",{className:"my-3",children:"JOB MATCHING"})}),Object(l.jsx)("div",{className:"d-flex  h-100",children:Object(l.jsx)(M,{value:t,onChange:c})})]})}var L=c(13),_=c(62),B=c.n(_),$=[{time:(new Date).getTime()-Math.floor(1e6*Math.random()),content:"Lorem ipsum dolor sit amet, consectetur adipiscing elit"},{time:(new Date).getTime()-Math.floor(1e7*Math.random()),content:"consectetur adipiscing elit"}];function J(){var e=Object(s.useState)($),t=Object(r.a)(e,2),c=t[0],n=t[1],i=Object(s.useState)(""),a=Object(r.a)(i,2),j=a[0],d=a[1],o=function(){j&&(n([{time:(new Date).getTime(),content:j}].concat(Object(L.a)(c))),d(""))};return Object(l.jsxs)("div",{children:[Object(l.jsx)("textarea",{required:!0,className:"form-control",autoFocus:!0,value:j,onKeyDown:function(e){13===e.keyCode&&e.metaKey&&o()},onChange:function(e){console.log("handleTextAreaChange"),d(e.target.value)}}),Object(l.jsx)("div",{className:"d-flex justify-content-end",children:Object(l.jsx)("button",{type:"submit",className:"btn mt-2",onClick:o,disabled:!j.length,children:"Post"})}),c.length&&c.filter((function(e,t){return t<100})).map((function(e,t){var c=e.time,s=e.content;return Object(l.jsxs)("div",{className:"mt-3 border-bottom pb-3",children:[Object(l.jsx)("small",{className:"text-muted",children:Object(l.jsx)(B.a,{fromNow:!0,children:c})}),Object(l.jsx)("div",{children:s})]},t)}))]})}function P(){return Object(l.jsx)("button",{type:"button",className:"btn btn-secondary","data-toggle":"tooltip","data-placement":"top",title:"Tooltip on top",children:"Tooltip on top"})}function K(){return Object(l.jsxs)("div",{className:"row",children:[Object(l.jsx)("div",{className:"col-md-4 mr-3 mb-3",children:Object(l.jsx)(F,{})}),Object(l.jsx)("div",{className:"col-md-8 mr-3 mb-3",children:Object(l.jsx)(W,{})})]})}function F(){return Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsxs)("div",{className:"d-flex flex-row",children:[Object(l.jsx)("span",{style:{width:"52px",height:"52px",lineHeight:"52px"},className:"bg-secondary text-light rounded-circle d-inline-block",children:Object(l.jsx)("div",{className:"d-flex justify-content-center align-items-center",children:Object(l.jsx)("i",{className:"bi bi-person-fill h2 mb-0",style:{lineHeight:"52px"}})})}),Object(l.jsx)("span",{className:"d-inline-block ms-2 mb-0",style:{lineHeight:"52px"},children:Object(l.jsx)("strong",{children:"$FIRST_NAME, $LAST_NAME"})})]}),Object(l.jsx)("div",{}),Object(l.jsx)("div",{className:"mt-2",children:Object(l.jsxs)("div",{className:"list-group list-group-flush",children:[Object(l.jsxs)("strong",{className:"font-weight-bold list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Total Years of Experience"}),Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"JavaScript"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"HTML"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"CSS"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"React"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Machine Learning"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Java"})," ",Object(l.jsx)("span",{children:"1yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"PHP"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Node"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"AWS"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"MySQL"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"MongoDB"})," ",Object(l.jsx)("span",{children:"1yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Firebase"})," ",Object(l.jsx)("span",{children:"3yrs"})]})]})})]})})}function W(){return Object(l.jsx)("div",{className:"card",children:Object(l.jsx)("div",{className:"card-body",children:Object(l.jsxs)("div",{children:[Object(l.jsx)("h3",{children:"Working Experience"}),Object(L.a)(Array(3).keys()).map((function(e,t){return Object(l.jsxs)("div",{className:"my-3",children:[Object(l.jsx)("div",{children:"$POSITION"}),Object(l.jsx)("div",{children:"$COMPANY_NAME"}),Object(l.jsx)("div",{children:"$DATE_START, $DATE_END"}),Object(l.jsx)("div",{children:"$CONTRIBUTIONS"}),Object(l.jsx)("div",{children:"$TECH_STACK"})]},t)})),Object(l.jsx)("h3",{children:"Education"}),Object(L.a)(Array(3).keys()).map((function(e,t){return Object(l.jsxs)("div",{className:"my-3",children:[Object(l.jsx)("div",{children:"$SCHOOL_NAME"}),Object(l.jsx)("div",{children:"$MAJOR"}),Object(l.jsx)("div",{children:"$DATE_START, $DATE_END"})]},t)}))]})})})}function U(e){var t=e.phrase;return Object(l.jsxs)(l.Fragment,{children:[Object(l.jsx)(j,{phrase:t}),Object(l.jsx)(p,{phrase:t}),Object(l.jsx)(H,{phrase:t}),Object(l.jsx)(T,{phrase:t})]})}var V=function(){var e=Object(s.useState)(""),t=Object(r.a)(e,2),c=t[0],n=t[1];return Object(l.jsx)(a.a,{children:Object(l.jsxs)("div",{className:"App",children:[Object(l.jsxs)("div",{className:"container",style:{minHeight:"calc(100vh - 239px)"},children:[Object(l.jsx)(R,{phrase:c,handlePhraseChange:function(e){console.log(e.target.value),n(e.target.value)}}),Object(l.jsx)("div",{className:"container",children:Object(l.jsxs)(f.c,{children:[Object(l.jsx)(f.a,{exact:!0,path:"/",children:Object(l.jsx)(U,{phrase:c})}),Object(l.jsx)(f.a,{path:"/talents",children:Object(l.jsx)(j,{phrase:c})}),Object(l.jsx)(f.a,{path:"/job/:id",component:v}),Object(l.jsx)(f.a,{path:"/story/social",component:J}),Object(l.jsx)(f.a,{path:"/resume",component:K}),Object(l.jsx)(f.a,{path:"/bootstrap-lab/tooltip",component:P})]})})]}),Object(l.jsx)(S,{classNames:"mt-3"})]})})};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(Object(l.jsx)(V,{}),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))}},[[81,1,2]]]);
//# sourceMappingURL=main.b9c74837.chunk.js.map