package com.egaz.visitors.entity;

/**
 * Majina ya enum lazima yafanane herufi kwa herufi na maadili
 * yaliyopo kwenye column `role` ENUM('admin','receptionist') ya MySQL,
 * kwa sababu @Enumerated(EnumType.STRING) inahifadhi jina la constant.
 */
public enum Role {
    admin,
    receptionist
}
