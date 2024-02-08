import datetime
import json
import os
import traceback
import dateutil.parser
import gridfs
from confluent_kafka import Consumer
import paho.mqtt.client as mqtt
from AnchorsVisualize import AnchorsTabularVisualize
from DBConnection import DBConnection
from logservice import LogService

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
KAFKA_GROUP_ID = os.environ.get("KAFKA_GROUP_ID")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC")
MQTT_SERVER = os.environ.get("MQTT_SERVER")
MQTT_TOPIC_PUBLISH = os.environ.get("MQTT_TOPIC_PUBLISH")
MQTT_TOPIC_PUBLISH_ERROR = os.environ.get("MQTT_TOPIC_PUBLISH_ERROR")
MQTT_PORT = os.environ.get("MQTT_PORT")

consumer = Consumer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER, 'group.id': KAFKA_GROUP_ID, 'max.poll.interval.ms': 14400000})
consumer.subscribe([KAFKA_TOPIC])

if __name__ == "__main__":
    LogService.send_message_to_kafka('INFO', "Database connection init...")
    db = DBConnection().get_connection()['explainer']
    fs = gridfs.GridFS(db)
    LogService.send_message_to_kafka('INFO', KAFKA_GROUP_ID + " container started...")
    print("Started...")
    client = mqtt.Client()
    client.connect(MQTT_SERVER, port=int(MQTT_PORT))
    client.loop_start()

    while True:
        msg = consumer.poll(1)
        if msg is None:
            continue
        if msg.error():
            LogService.send_message_to_kafka('ERROR', str(msg.error()))
            print('Error: {}'.format(msg.error()))
            continue
        post_data = msg.value().decode('utf-8')
        LogService.send_message_to_kafka('INFO', "Container " + KAFKA_GROUP_ID + " received kafka message")
        print(post_data)

        post_data = json.loads(post_data)
        analyse_id = post_data['id']

        try:
            model = json.loads(post_data['model'])
            explainer = json.loads(post_data['explainer'])
            explainer_id = explainer['id']
            topic = post_data['topic']
            samples = post_data['samples']
            data = samples[0]
            analysis_start_date = post_data['analysisStartDate']
            model_id = model['id']
            explainer_name = explainer['name']
            input_type = explainer['inputType']

            if input_type == 'tabular':

                column_names = "".join(explainer['columnNames']).split(",")
                label_column = "".join(explainer['labelColumn'])

                LogService.send_message_to_kafka('INFO', "Start of ANCHORS visualization...")
                exp = AnchorsTabularVisualize()

                visualization = exp.visualization(data, model_id, explainer_name, explainer_id, column_names,
                                                 label_column)

            LogService.send_message_to_kafka('INFO', "End of ANCHORS visualization...")
            LogService.send_message_to_kafka('INFO', "Saving ANCHORS visualization...")

            result_id = fs.put(json.dumps(
                {'modelName': model['name'],
                 'explainerName': explainer_name,
                 'sample': data,
                 'visualizationData': visualization}).encode('utf-8'), explainerName=explainer_name,
                               analyseId=analyse_id)

            db.analyse.insert_one({
                '_id': analyse_id,
                'explainerId': explainer['id'],
                'explainerName': explainer['name'],
                'modelId': model['id'],
                'modelName': model['name'],
                'analysisStartDate': dateutil.parser.parse(analysis_start_date),
                'analysisEndDate': datetime.datetime.now(),
                'source': 'KAFKA',  # TODO do zmiany w trakcie ogarniania modelów
                'topic': topic,
                'samples': samples,
                'result': result_id
            })

            LogService.send_message_to_kafka('INFO', "ANCHORS visualization saved...")
            info_message_for_front = {'analyseId': analyse_id, 'message': "Created"}
            client.publish(MQTT_TOPIC_PUBLISH, json.dumps(info_message_for_front), qos=1)

            LogService.send_message_to_kafka('INFO', "Message to MQTT published...")

        except Exception as e:

            error_message_for_front = {'analyseId': analyse_id, 'message': type(e).__name__ + ":" + str(e)}
            LogService.send_message_to_kafka('ERROR', str(traceback.format_exc()))
            client.publish(MQTT_TOPIC_PUBLISH_ERROR, json.dumps(error_message_for_front), qos=1)
            LogService.send_message_to_kafka('INFO', "Error message to MQTT published...")

