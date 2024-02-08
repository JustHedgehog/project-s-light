import io
import pickle
import dill
import gridfs
import joblib
import pandas as pd
import requests
import shap
from bson import ObjectId
from DBConnection import DBConnection


class ShapTabularGenerate():

    def __init__(self):
        self.model_type = None
        self.model = None
        self.categorical_features = None
        self.categorical_names = []
        self.categorical_features_idx = []
        self.encoded_label = None
        self.classes_encoded = None
        self.label = None
        self.features = None
        self.label_column = None
        self.explainer_name = None
        self.model_id = None
        self.column_names = None
        self.explainer_id = None
        self.explainer = None

    def get_encoded_classes(self, db):
        label_encoder_id = db.encoder.find_one({'modelId': self.model_id,
                                                'type': 'label_encoder.pkl'})['dataId']
        fs = gridfs.GridFS(db)
        label_encoder = pickle.loads(fs.get(ObjectId(label_encoder_id)).read())

        classes_encoded = label_encoder.classes_

        return classes_encoded

    def prepare_dataset(self, train_data, categorical_list, sep, db):
        buffer = io.StringIO(train_data)
        frames = [pd.read_csv(buffer, sep=sep, low_memory=False)]
        csv = pd.concat(frames)
        csv = csv[self.column_names]

        for c in categorical_list:
            self.categorical_features_idx.append(csv.columns.get_loc(c))
            label_en_id = db.encoder.find_one({'modelId': self.model_id,
                                               'type': c + '_encoder.pkl'})['dataId']
            fs = gridfs.GridFS(db)
            label_en = pickle.loads(fs.get(ObjectId(label_en_id)).read())
            csv[c] = label_en.transform(csv[c])

        filter_column_without_label = csv.columns[~csv.columns.isin([self.label_column])]
        data_without_label = csv[filter_column_without_label]

        classes_encoded = self.get_encoded_classes(db)
        feature = data_without_label.values

        return feature, classes_encoded

    def predict_probs(self, data):
        return self.model.predict_proba(data)

    def generate(self, train_dataset, column_names, categorical_features, label_column, model_id, explainer_name,
                 explainer_id, model_type, model_file_id):
        # Database connection
        db = DBConnection().get_connection()['explainer']
        fs = gridfs.GridFS(db)

        self.categorical_features = categorical_features
        self.explainer_id = explainer_id
        self.column_names = column_names
        self.model_id = model_id
        self.explainer_name = explainer_name
        self.label_column = label_column
        self.model_type = model_type

        fs_model_file = fs.get(ObjectId(model_file_id))
        model_file_name = fs_model_file.filename
        if model_file_name.split('.')[-1] == "h5":
            self.model = pickle.loads(fs_model_file.read())
        if model_file_name.split('.')[-1] == "joblib":
            self.model = joblib.load(fs_model_file)

        self.features, self.classes_encoded = self.prepare_dataset(train_dataset, categorical_features, sep=",", db=db)
        # column names ipkt,ibyt,fwd,stos,opkt,obyt,_in,out,sas,das,smk,dmk,dtos,_dir,svln,dvln,cl,sl,al,attack_t
        # feature names Input Packets,Input Bytes,First switched,Src IP TOS,Output Packets,Output Bytes,Input SNMP,Output SNMP,Source ASN,Destination ASN,Source Mask,Destination Mask,Destination IP TOS,Direction,Source VLAN,Destination VLAN,cl,sl,al,Total Flow
        # categorical_features {0: ['icmp', 'tcp', 'udp']}
        # creation of an explainer
        self.explainer = shap.Explainer(self.predict_probs, self.features)

        # Saving
        fs.put(dill.dumps(self.explainer), modelId=model_id, explainerName=explainer_name, explainerId=explainer_id,
               type='explainer')
