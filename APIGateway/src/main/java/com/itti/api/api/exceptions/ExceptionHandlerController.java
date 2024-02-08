package com.itti.api.api.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class ExceptionHandlerController {

    @ExceptionHandler({
            AnalyseNotFound.class,
            ExplainerNotFound.class,
            ModelNotFound.class,

    })
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorMessage notFoundException(RuntimeException exception){
        return new ErrorMessage(HttpStatus.NOT_FOUND.value(), exception.getMessage());
    }

    @ExceptionHandler({
            DatasetSaveException.class,
            ResultReadException.class,
            ProducerSendException.class,
    })
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorMessage badRequest(RuntimeException exception){
        return new ErrorMessage(HttpStatus.BAD_REQUEST.value(), exception.getMessage());
    }

}
