import io
import pickle

import dill
import gridfs
import pandas as pd
import lime.lime_tabular
from bson import ObjectId

from DBConnection import DBConnection


class LimeTabularGenerate():
    def __init__(self):
        self.categorical_features_idx = []
        self.explainer = None
        self.categorical_names = {}
        self.encoded_label = None
        self.classes_encoded = None
        self.label = None
        self.features = None
        self.label_column = None
        self.explainer_name = None
        self.model_id = None
        self.column_names = None
        self.explainer_id = None
        self.categorical_features = []
        self.db = DBConnection().get_connection()['explainer']
        self.fs = gridfs.GridFS(self.db)

    def get_encoded_classes(self):
        label_encoder_id = self.db.encoder.find_one({'modelId': self.model_id,
                                                     'type': 'label_encoder.pkl'})['dataId']

        label_encoder = pickle.loads(self.fs.get(ObjectId(label_encoder_id)).read())

        classes_encoded = label_encoder.classes_

        return classes_encoded

    def prepare_dataset(self, train_data, categorical_list, sep):
        buffer = io.StringIO(train_data)
        frames = [pd.read_csv(buffer, sep=sep, low_memory=False)]
        csv = pd.concat(frames)
        csv = csv[self.column_names]

        for c in categorical_list:
            self.categorical_features_idx.append(csv.columns.get_loc(c))
            label_en_id = self.db.encoder.find_one({'modelId': self.model_id,
                                                    'type': c + '_encoder.pkl'})['dataId']
            label_en = pickle.loads(self.fs.get(ObjectId(label_en_id)).read())
            csv[c] = label_en.transform(csv[c])
            self.categorical_names[csv.columns.get_loc(c)] = label_en.classes_

        filter_column_without_label = csv.columns[~csv.columns.isin([self.label_column])]
        data_without_label = csv[filter_column_without_label]

        classes_encoded = self.get_encoded_classes()
        feature = data_without_label.values

        return feature, classes_encoded

    def generate(self, train_dataset, feature_names, column_names, label_column,
                 categorical_features, model_id,
                 explainer_name, explainer_id):
        self.categorical_features = categorical_features
        self.explainer_id = explainer_id
        self.column_names = column_names
        self.model_id = model_id
        self.explainer_name = explainer_name
        self.label_column = label_column

        self.features, self.classes_encoded = self.prepare_dataset(train_dataset, categorical_features, sep=",")

        # column names ipkt,ibyt,fwd,stos,opkt,obyt,_in,out,sas,das,smk,dmk,dtos,_dir,svln,dvln,cl,sl,al,attack_t
        # feature names Input Packets,Input Bytes,First switched,Src IP TOS,Output Packets,Output Bytes,Input SNMP,Output SNMP,Source ASN,Destination ASN,Source Mask,Destination Mask,Destination IP TOS,Direction,Source VLAN,Destination VLAN,cl,sl,al,Total Flow
        # categorical_features {0: ['icmp', 'tcp', 'udp']}
        # creation of an explainer

        self.explainer = lime.lime_tabular.LimeTabularExplainer(self.features,
                                                                feature_names=feature_names,
                                                                class_names=self.classes_encoded,
                                                                categorical_features=self.categorical_features_idx,
                                                                categorical_names=self.categorical_names,
                                                                )

        fs = gridfs.GridFS(self.db)
        fs.put(dill.dumps(self.explainer), modelId=model_id, explainerName=explainer_name, explainerId=explainer_id,
               type='explainer')
