#! /bin/bash
#
docker login -u andreole@ar.ibm.com -p !ZXCasdqwe09876 registry.redhat.io
docker pull registry.redhat.io/ubi8/ubi
docker images
#
