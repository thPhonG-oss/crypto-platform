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

    // Prefix cho các kênh dữ liệu. Ví dụ: market_data:btcusdt
    public static final String MARKET_TOPIC_PREFIX = "market_data:";

    // Pattern để lắng nghe tất cả các kênh bắt đầu bằng prefix trên
    public static final String MARKET_TOPIC_PATTERN = "market_data:*";

    // 1. Container lắng nghe tin nhắn từ Redis
    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                            MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // QUAN TRỌNG: Sử dụng PatternTopic để nghe nhiều kênh cùng lúc
        container.addMessageListener(listenerAdapter, new PatternTopic(MARKET_TOPIC_PATTERN));

        return container;
    }

    // 2. Bộ chuyển đổi: Khi có tin nhắn đến -> gọi hàm handleMessage của RedisSubscriber
    @Bean
    MessageListenerAdapter listenerAdapter(RedisSubscriber subscriber) {
        // Hàm xử lý bên RedisSubscriber vẫn tên là "handleMessage"
        return new MessageListenerAdapter(subscriber, "handleMessage");
    }
}