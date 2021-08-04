FROM registry.redhat.io/ubi8/ubi
#
ENV  PORT=3004
ENV  GS4JS_HOME="/usr/lib64"
ENV  GS4JS_LIB="libgs.so.9"
#
MAINTAINER Sebastian Andreoletti <andreole@ar.ibm.com>
LABEL      description="Servicio para convertir postscript a PDF"
#
ADD     src            ./src
ADD     ./package.json ./
ADD     ./.env         ./
#
RUN        dnf install -y python3 \
        && yum install -y gcc gcc-c++ make nodejs ghostscript \
        && yum clean all
#
RUN   npm install
#
## USER    root
WORKDIR /
EXPOSE ${PORT}
#
ENTRYPOINT  npm run start
## CMD ["start"]
#