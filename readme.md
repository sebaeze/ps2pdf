## Install
```
git clone git@github.ibm.com:Billing-and-Invoicing-SSA/postscript2pdf.git
docker build -t ps2pdf .
docker run -d --name=somename -p 3004:3004 ps2pdf 
```

## Test
```
curl -v -X POST --data-binary @"postscript_file.ps"   "http://127.0.0.1:8080/ps2pdf?output=email&email=uno@ar.ibm.com,dos@ar.ibm.com&filename=frutaaa.pdf"
```