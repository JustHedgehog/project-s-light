FROM python:3.10

RUN mkdir /app

WORKDIR /app
COPY reqall.txt /app

RUN apt-get update && apt-get -y install
RUN apt install -y graphviz
RUN pip install opencv-python
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y
RUN apt-get update && apt-get install python3-dev graphviz libgraphviz-dev pkg-config -y
RUN pip install --upgrade pip

RUN pip install -r reqall.txt

