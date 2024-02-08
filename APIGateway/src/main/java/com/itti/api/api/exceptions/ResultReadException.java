package com.itti.api.api.exceptions;

public class ResultReadException extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public ResultReadException(){
        super("Couldn't read result of analysis");
    }
}
