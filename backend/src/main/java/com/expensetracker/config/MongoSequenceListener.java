package com.expensetracker.config;

import com.expensetracker.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

@Component
public class MongoSequenceListener extends AbstractMongoEventListener<Object> {

    private final SequenceGeneratorService sequenceGenerator;

    @Autowired
    public MongoSequenceListener(SequenceGeneratorService sequenceGenerator) {
        this.sequenceGenerator = sequenceGenerator;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object source = event.getSource();
        if (source != null) {
            ReflectionUtils.doWithFields(source.getClass(), field -> {
                if (field.isAnnotationPresent(Id.class) && field.getType().equals(Long.class)) {
                    field.setAccessible(true);
                    Long id = (Long) field.get(source);
                    if (id == null || id < 1) {
                        String collectionName = event.getCollectionName();
                        // If the class has a @Document annotation, we can use its specified collection name, otherwise fallback to the event's collection name
                        Document docAnnotation = source.getClass().getAnnotation(Document.class);
                        if (docAnnotation != null && !docAnnotation.collection().isEmpty()) {
                            collectionName = docAnnotation.collection();
                        }
                        field.set(source, sequenceGenerator.generateSequence(collectionName + "_sequence"));
                    }
                }
            });
        }
    }
}
