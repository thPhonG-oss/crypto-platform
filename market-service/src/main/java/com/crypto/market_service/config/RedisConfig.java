package com.crypto.market_service.config;

import com.crypto.market_service.service.RedisSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisConfig {

    // Tên kênh mà chúng ta sẽ chat với nhau qua Redis
    public static final String MARKET_TOPIC = "market_realtime_data";

    // 1. Container lắng nghe tin nhắn từ Redis
    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                            MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // Đăng ký lắng nghe topic "market_realtime_data"
        container.addMessageListener(listenerAdapter, new PatternTopic(MARKET_TOPIC));
        return container;
    }

    // 2. Bộ chuyển đổi: Khi có tin nhắn đến -> gọi hàm handleMessage của RedisSubscriber
    @Bean
    MessageListenerAdapter listenerAdapter(RedisSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "handleMessage");
    }
}