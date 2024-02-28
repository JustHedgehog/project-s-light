# XAI serving component open source for the SOFTWAREX Journal

How to get the code working:
The module utilizes several docker containers to facilitate serving explanations to the user. 

You can download the example explainers for a sample model here:
https://drive.google.com/file/d/1Uy4gfFijconZ58sSiuncJdq8Embe08-H/view?usp=sharing
and extract the files in the main project folder (./explainer/)

To deploy the component:

Have the Docker Daemon running

Go to the PythonBaseDocker directory 

Execute to build the main docker image (the dot at the end is important):

docker build -t python-image . 

Then go back to the main project directory and execute the command below to run the dockers locally

docker compose -f docker-compose-local.yml up -d 

Now to get the sample explainers, copy the explainer directory to the MongoDB container:

docker cp explainer project-s-light-mongodb-1:/

# Execute the below command to restore the explainers in MongoDB
docker exec -it project-s-light-mongodb-1 sh -c 'mongorestore -d explainer explainer/'

Once the setup is complete you can access the dashboard via 
http://localhost:3000/


