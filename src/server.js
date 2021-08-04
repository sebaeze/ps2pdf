/*
*
*/
if ( process.env.AMBIENTE!=="TEST" && process.env.AMBIENTE!=="PROD" ){
  require('dotenv').config() ;   // <---- Carga variables de entorno desde archivo .env
} ;
//
const enviarEmail     = require("./lib/emailSMTP").enviarEmail ;
//
const express = require('express') ;
const app     = express() ;
const port    = process.env.PORT || 3004
const gs      = require('ghostscript4js')
const fs      = require("fs")   ;
const path    = require("path") ;
//
/*
const bodyParser = require('body-parser');
app.use(bodyParser.text({limit: "100mb"})) ;
app.use(bodyParser.json({limit: "100mb"}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true}));
*/
//
function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    next();
  });
} ;
app.use(rawBody);
/*
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(rawBody);
  //app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});
*/
//
console.log("...port: ",port,"...") ;
//
app.get('/', (req, res) => {
  res.send('*** HOLA   *****')
}) ;
//
app.listen(port, () => {
  console.log(`**** Ejecutandose ****`) ;
}) ;
//
//
app.post("/ps2pdf"  , (req,res)=>{
  //
  let psFullPath  = "" ;
  let pdfFullPath = "" ;
  //
  try {
    //
    if (!fs.existsSync("/temp")){
      fs.mkdirSync("/temp");
    } ;
    //
    let reqtype    = (req.headers && req.headers['content-type']!=undefined) ? req.headers['content-type'] : "application/json" ;
    reqtype        = reqtype.toLowerCase() ;
    let outType    = "_UNKNOWN_" ;
    let pathFolder = path.join( __dirname, "../temp" ) ;
    let psFile  = "temp_"+String(new Date().getTime())+"_postscript.ps"   ;
    let pdfFile = psFile+".pdf" ;
    psFullPath  = path.join( pathFolder ,`./${psFile}`  ) ;
    pdfFullPath = path.join( pathFolder ,`./${pdfFile}` ) ;
    //
    console.log("....psFile: ",psFile," pdfFile: ",pdfFile,"\n psFullPath: ",psFullPath," \n pdfFullPath: ",pdfFullPath,";");
    //
    console.log("...query: ",req.query,";");
    fs.writeFileSync( psFullPath , req.rawBody , "binary" ) ;
    //
    gs.executeSync(`-q -P- -dSAFER -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.4  -o ./temp/${pdfFile} ./temp/${psFile} `) ;
    //
    if ( req.query && req.query.output && typeof req.query.output=="string" ){
      outType = req.query.output ;
    } ;
    //
    switch(outType.trim().toUpperCase()){
      case "EMAIL":
        //
        let emailDest   = (req.query && req.query.email) ? req.query.email : "andreole@ar.ibm.com" ;
        if ( typeof emailDest=="string" ){
          if ( emailDest.indexOf(",") ){
            emailDest = emailDest.split(",") ;
          } else {
            emailDest = [ emailDest ] ;
          } ;
        } ;
        console.log("..emailDest: ",emailDest,";") ;
        //
        let fileNamePDF = (req.query && req.query.filename) ? req.query.filename : pdfFile ;
        let configEmail = process.env.SMTP!=undefined ? process.env.SMTP : require('dotenv').config() ;
        configEmail     = typeof configEmail=="string" ? JSON.parse(configEmail) : configEmail ;
        console.log("..configEmail: ",configEmail,";") ;
        // var fileSTR = fs.readFileSync( pdfFullPath, "utf8" ) ;
        enviarEmail(
              configEmail ,
              `${process.env.AMBIENTE}: ${fileNamePDF} `,
              emailDest ,
              {attachments:[
                {
                  filename:    fileNamePDF ,
                  path:        pdfFullPath ,
                  contentType: 'application/pdf'
                }
              ]}
            )
          .then((respEmail)=>{
            res.json({msg:"ok"}) ;
            try {
              fs.unlinkSync( psFullPath  ) ;
              fs.unlinkSync( pdfFullPath ) ;
            } catch(errUL){
              console.log("...errUL: ",errUL) ;
            } ;
          })
          .catch((respErr)=>{
            res.status(500) ;
            res.json({error:`ERROR: /ps2pdf:: sending email: '${JSON.stringify(respErr)}'`})
          }) ;
        //
      break ;
      case "PDF":
        var file = fs.createReadStream( pdfFullPath ) ;
        var stat = fs.statSync( pdfFullPath );
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
        file.pipe(res) ;
        //
        try {
          fs.unlinkSync( psFullPath  ) ;
          fs.unlinkSync( pdfFullPath ) ;
        } catch(errUL){
          console.log("...errUL: ",errUL) ;
        } ;
        //
      break ;
      default:
        res.status(500) ;
        res.json({error:`ERROR: /postscript2pdf:: tipo de output desconocido: '${outType}'`})
        //
        try {
          fs.unlinkSync( psFullPath  ) ;
          fs.unlinkSync( pdfFullPath ) ;
        } catch(errUL){
          console.log("...errUL: ",errUL) ;
        } ;
        //
      break ;
    } ;
    //
  } catch(errPD){
    console.log("***ERROR: ",errPD," ****") ;
    res.status(500);
    res.json({
      error: "/postscript2pdf:: error",
      msg: errPD
    }) ;
    //
    try {
      fs.unlinkSync( psFullPath  ) ;
      fs.unlinkSync( pdfFullPath ) ;
    } catch(errUL){
      console.log("...errUL: ",errUL) ;
    } ;
    //
  } ;
  //
}) ;
//