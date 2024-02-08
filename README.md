# Project s


Przejście do folderu PythonBaseDocker

docker build -t python-image . <- zbudowanie obrazu dla innych kontenerów

Następnie przejście do katalogu głównego projektu

docker compose -f docker-compose-local.yml up -d <- dla odpalenia lokalnie

przykładowe dane dla expaliner'a lime'a dla modelu sparta

Input type: tabular

Column Names: ipkt,ibyt,fwd,stos,opkt,obyt,_in,out,sas,das,smk,dmk,dtos,_dir,svln,dvln,cl,sl,al,attack_t

Label Column: attack_t

Feature Names: Input Packets,Input Bytes,First switched,Src IP TOS,Output Packets,Output Bytes,Input SNMP,Output SNMP,Source ASN,Destination ASN,Source Mask,Destination Mask,Destination IP TOS,Direction,Source VLAN,Destination VLAN,cl,sl,al,Total Flow

Categorical Features:

Train Dataset: dataset litnet simulator test_x.csv

Model: sparta_model