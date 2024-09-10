FROM node:22.4.1

RUN apt-get clean && apt-get update 

WORKDIR /myfolder/

COPY ./package.json /myfolder/
COPY ./package-lock.json /myfolder/
RUN npm install

COPY . /myfolder

ENV TZ Asia/Seoul

ENV PORT=${SERVER_PORT}

EXPOSE ${PORT}

CMD npm run start:dev