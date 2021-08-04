
/*
*
*/
const nodemailer             = require('nodemailer') ;
const fs                     = require('fs') ;
const path                   = require('path') ;
const htmlTemplate           = fs.readFileSync( path.join(__dirname,'./emailTemplate.html'), 'utf8' ) ;
//
// console.log("...htmlTemplate: ",htmlTemplate,";") ;
const log = require("debug")("CONECTOR::SMTP") ;
//
const obj2Table = (argObj) => {
    let outHtml = '' ;
    try {
        //
        let tempArr = Array.isArray(argObj) ? argObj : new Array(argObj) ;
        if ( tempArr.length==0 ){
            return '' ;
        }
        //
        let columns = Object.keys(tempArr[0]) ;
        //
        outHtml += '<table style="border-collapse: collapse;width:100%;"><thead><tr>' ;
        columns.forEach((elemHH)=>{
            outHtml+='<th>'+elemHH+'</th>' ;
        })
        outHtml += '</tr></thead><tbody>' ;
        //
        tempArr.forEach((elemObj)=>{
            outHtml+='<tr>' ;
            columns.forEach((elemKey)=>{
                outHtml+='<td style="border: 1px solid black;">'+elemObj[elemKey]+'</td>' ;
            })
            outHtml+='</tr>' ;
        })
        //
        outHtml += '</tbody><table>' ;
        //
    } catch(erro2t){
        throw  erro2t ;
    }
    return outHtml ;
} ;
//
const enviarEmail = (argConfEmail,argSubject,argDestino,argBody) => {
    return new Promise((respOk,respRech)=>{
        try {
            //
            if ( argDestino.length==0 ){ console.log(`*** NO HAY DESTINATARIOS PARA EMAIL "${argSubject}" ***`) ; return false ; } ;
            //
            let tempEnv = process.env.SMTP ? (typeof process.env.SMTP=="string" ? JSON.parse(process.env.SMTP) : process.env.SMTP) : false ;
            let emailDestinoDefault = tempEnv!=false ? tempEnv.emailDestinoDefault : argConfEmail.emailDestinoDefault || '' ;
            let nombreSender        = tempEnv!=false ? tempEnv.nombreSender        : argConfEmail.nombreSender || '' ;
            //
            let configSmtp = {
                host:       tempEnv!=false ? tempEnv.server : argConfEmail.SMTPServer|| false ,
                port:       tempEnv!=false ? tempEnv.port   : argConfEmail.SMTPPort||'25'  ,
                secure:     (tempEnv!=false && tempEnv.flagSecure!=undefined) ? tempEnv.flagSecure : false
            } ;
            if ( tempEnv.tls ){ configSmtp.tls = tempEnv.tls ; }
            //
            let mailOptions = {
                from:    nombreSender,
                to:      emailDestinoDefault,
                subject: 'Hello ✔',
                text:    'Hello world?',
                html:    '<b>Hello world?</b>'
            };
            //
            let transporter = nodemailer.createTransport({ ...configSmtp });
            //
            try {
                //
                let arrayAttachments = [] ;
                mailOptions.subject  = argSubject ;
                mailOptions.to       = (argDestino && String(argDestino).length>0 ) ? argDestino : emailDestinoDefault||'' ;
                let strBody = "" ;
                if ( typeof argBody==="object" ){
                    if ( argBody.attachments!=undefined ){
                        strBody          = argBody.text || argBody.body  || "" ;
                        arrayAttachments = Array.isArray(argBody.attachments) ? argBody.attachments : [argBody.attachments] ;
                    } else {
                        if ( Array.isArray(argBody) ){
                            argBody.forEach((elembody)=>{
                                strBody = strBody + "\r" + ( typeof elembody=="string" ? elembody : JSON.stringify(elembody) ) ;
                            }) ;
                        } else {
                            if ( argBody.FLAG_REPORT_TABLE!=undefined && argBody.FLAG_REPORT_TABLE===true ){
                                let arrayReport = argBody[ argBody.FIELD_DATA ] ;
                                strBody = obj2Table( arrayReport ) ;
                            } else {
                                for ( let keyInner in argBody ){
                                    let valInner = argBody[keyInner] ;
                                    strBody = strBody + "\r" + keyInner + ":" + ( typeof valInner=="string" ? valInner : JSON.stringify(valInner) ) ;
                                } ;
                            } ;
                        } ;
                    } ;
                } else {
                    strBody    = String(argBody) ;
                } ;
                mailOptions.text    = strBody ;
                mailOptions.html    = '<b>'+strBody+'<\b>' ;
                //
                if ( arrayAttachments.length>0 ){
                    mailOptions.attachments = arrayAttachments.map((elem2map,idx)=>{
                        let objAtt = typeof elem2map=="object" ? elem2map : { filename: `Adjunto_${idx}.txt`, content:   elem2map } ;
                        return objAtt ;
                    }) ;
                } ;
                // log('...mailOptions: ',mailOptions) ;
                //
            } catch(errParseMsg){
                log("ERROR: errParseMsg: ",errParseMsg,";") ;
                respRech({
                    error: errParseMsg ,
                    msg: "*** ERROR en parse mensaje de email ***"
                })
            } ;
            //
            if ( String(mailOptions.to).length>0 ){
                nodemailer.createTestAccount((err, account) => {
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            log(error);
                            let errEmail = new Error(error)
                            throw errEmail ;
                        } else {
                            log('Message sent: %s', info.messageId);
                            log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                            respOk({
                                msgId: info.messageId||"",
                                info:  info||""
                            })
                        } ;
                    });
                });
            } else {
                respOk({
                    msgId: "" ,
                    info: "***  NO SE ENVIO A NADIE ***"
                }) ;
            } ;
            //    
        } catch(errEM){
            respRech(errEM) ;
        } ;
    }) ;
} ;
//
module.exports.enviarEmail = enviarEmail ;
//