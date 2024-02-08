package com.itti.api.api.exceptions;

public class DatasetSaveException extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public DatasetSaveException(){
        super("Couldn't save dataset to database");
    }
}
