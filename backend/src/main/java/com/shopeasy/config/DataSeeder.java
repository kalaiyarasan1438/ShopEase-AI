package com.shopeasy.config;

import com.shopeasy.entity.*;
import com.shopeasy.repository.*;
import com.shopeasy.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final OrderRepository orderRepository;

    // Each product definition: {name, price, oldPrice, badge, description, category, img, thumb, g1, g2, g3}
    // All image URLs are absolute, verified CDN links.

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure admin user exists regardless of existing data
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() ->
            roleRepository.save(Role.builder().name("ROLE_ADMIN").build())
        );
        if (!userRepository.existsByEmail("admin@shopeasy.com")) {
            User adminUser = User.builder()
                .firstName("Admin")
                .lastName("User")
                .email("admin@shopeasy.com")
                .password(passwordEncoder.encode("Admin@123"))
                .enabled(true)
                .build();
            adminUser.getRoles().add(adminRole);
            userRepository.save(adminUser);
            log.info("Created default admin user");
        }

        // Seed products only if none exist
        if (productRepository.count() > 0) {
            log.info("Database already seeded with {} products — skipping product seeding.", productRepository.count());
            return;
        }


        log.info("Seeding database with categories, vendors, and 100 products...");

        // ── Categories ──────────────────────────────────────────────────
        Map<String, Category> cats = new LinkedHashMap<>();
        for (String[] c : new String[][] {
            {"Electronics", "electronics"},
            {"Fashion", "fashion"},
            {"Sports", "sports"},
            {"Home & Living", "home-living"},
            {"Books", "books"},
            {"Beauty & Care", "beauty-care"},
            {"Hair & Care", "hair-care"},
        }) {
            cats.put(c[0], categoryRepository.save(
                Category.builder().name(c[0]).slug(c[1]).build()
            ));
        }

        // Find or create roles
        Role vendorRole = roleRepository.findByName("ROLE_VENDOR").orElseGet(() ->
            roleRepository.save(Role.builder().name("ROLE_VENDOR").build())
        );
        Role userRole = roleRepository.findByName("ROLE_USER").orElseGet(() ->
            roleRepository.save(Role.builder().name("ROLE_USER").build())
        );

        // ── Duplicate role and admin user creation block removed (handled earlier) ──────────────────────────

        Vendor vendor;
        Optional<Vendor> existingVendor = vendorRepository.findAll().stream().findFirst();
        if (existingVendor.isPresent()) {
            vendor = existingVendor.get();
        } else {
            User vendorUser = userRepository.findByEmail("vendor@shopeasy.com").orElseGet(() -> {
                User u = User.builder()
                    .firstName("TechWave")
                    .lastName("Store")
                    .email("vendor@shopeasy.com")
                    .password(passwordEncoder.encode("Vendor@123"))
                    .enabled(true)
                    .build();
                u.getRoles().add(vendorRole);
                return userRepository.save(u);
            });
            vendor = vendorRepository.save(Vendor.builder()
                .user(vendorUser)
                .businessName("TechWave Official Store")
                .status(Vendor.VendorStatus.APPROVED)
                .build());
        }

        Random rng = new Random(42);

        // ── Product definitions ──────────────────────────────────────────
        // Format: {name, price, oldPrice|null, badge|null, description, category, imgUrl, thumbUrl, gallery1, gallery2, gallery3}
        List<String[]> defs = new ArrayList<>();

        // ═══════════════════════════════════════════════════════════════
        // ELECTRONICS (20 products)
        // ═══════════════════════════════════════════════════════════════

        defs.add(new String[]{"Pro Wireless Headphones", "12999", "16999", "Best Seller",
            "Premium noise-cancelling over-ear headphones with 40hr battery life and Hi-Res audio",
            "Electronics",
            "https://www.boat-lifestyle.com/cdn/shop/files/PLAYBACK_8ab39cfd-2c3b-4df1-850f-cd901ca8d6d8_1800x.jpg?v=1754030752",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/headphone/t/j/x/-original-imahc7fjssfgy46f.jpeg?q=20",
            "https://tapwell.in/wp-content/uploads/2025/01/WhatsApp-Image-2025-06-11-at-5.49.08-PM-1.jpeg",
            "https://tapwell.in/wp-content/uploads/2025/01/WhatsApp-Image-2025-06-11-at-5.49.08-PM-1.jpeg",
            "https://tapwell.in/wp-content/uploads/2025/01/WhatsApp-Image-2025-06-11-at-5.49.08-PM-1.jpeg"
        });

        defs.add(new String[]{"Smart Watch Ultra", "24999", "34999", "Hot Deal",
            "Advanced health tracking, GPS, AMOLED display, 7-day battery",
            "Electronics",
            "https://celltophone.com/wp-content/uploads/2025/01/T900-Ultra-Smart-Watch.webp",
            "https://celltophone.com/wp-content/uploads/2025/01/T900-Ultra-Smart-Watch.webp",
            "https://image.cdn.shpy.in/273060/1696870791388_SKU-0186_0.jpg?width=600&format=webp",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_KW6GCRe_9j3BFa3yoQB384anGZzSs_MWFaYCr1uZ-kNl8LE-tGSXcV3s&s=10",
            "https://rukminim2.flixcart.com/image/480/480/xif0q/smartwatch/9/7/t/49-t800-ultrat-smartwatch-orange-android-ios-yash-enterprises-original-imah4b87ug2dch9x.jpeg?q=90"
        });

        defs.add(new String[]{"Laptop Stand Aluminium", "3999", "5999", null,
            "Ergonomic laptop riser with adjustable height, fits up to 17-inch laptops",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR5ZVwSEpAHfJkJ3F06C8PG1dXt0_aQoix5tkJuF-dc0XpmXUPGuIkKyBq&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR5ZVwSEpAHfJkJ3F06C8PG1dXt0_aQoix5tkJuF-dc0XpmXUPGuIkKyBq&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkTf0la9GvRmccV5msbWnMZgRHOhSlKU6wPnsE9q4pxPJPcICX0l5GgcI&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkTf0la9GvRmccV5msbWnMZgRHOhSlKU6wPnsE9q4pxPJPcICX0l5GgcI&s=10",
            "https://agarolifestyle.com/cdn/shop/files/6_742009fe-e028-4f16-8480-2c2cac099ed8.jpg?v=1756820518"
        });

        defs.add(new String[]{"USB-C Hub 7-in-1", "2999", "4999", "New",
            "HDMI 4K, USB 3.0, SD/TF reader, PD 100W charging",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd9u7njZw5sQTyKrvwvVeBIuwu9CwyzEXbPDyf1ExPAw&s",
            "https://www.tpstech.in/cdn/shop/files/Ugreen_Revodok_Pro_107_7-in-1_USB-C_Hub_with_4K_HDMI_100W_PD_10Gbps_Data_Transfer-tpstech.in.webp?v=1763720474",
            "https://www.tpstech.in/cdn/shop/files/Ugreen_Revodok_Pro_107_7-in-1_USB-C_Hub_with_4K_HDMI_100W_PD_10Gbps_Data_Transfer-tpstech.in.webp?v=1763720474",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZh0WlMNQnM3OLLLl054IgXGC_9UtIFe5uKIS1SbF4gg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZh0WlMNQnM3OLLLl054IgXGC_9UtIFe5uKIS1SbF4gg&s=10"
        });

        defs.add(new String[]{"Mechanical Gaming Keyboard", "10999", "15999", "Best Seller",
            "Cherry MX switches, per-key RGB, hot-swappable, aluminium frame",
            "Electronics",
            "https://computechstore.in/media/uploads/wp/2025/06/Ant-Esports-MK1900-RGB-Wired-Gaming-Keyboard-with-Volume-Knob-Alarm-Clock-White-2.jpg",
            "https://shop.zebronics.com/cdn/shop/files/Zeb-max-ninja-61-black-pic-1.jpg?v=1781169991&width=2000",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFCTgcmRiq94tg_7KWE-LoSRoRbDu1FG4ExZnPPt-l59Nre-0v7ordITs&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8eyMiMPl8LgPAwnqOYR5JWL3P-dSNX8-TThJGH6FDmA&s=10",
            "https://verityverse.in/cdn/shop/files/Artboard2Black.jpg?v=1770981994&width=2489"
        });

        defs.add(new String[]{"4K Webcam Pro", "7499", "10999", null,
            "Ultra-HD webcam with auto-focus, noise-cancelling mic, ring light",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbISaGHq1co4EUK4cMYfRjWYbdjkTxxtNSHTLnXAOl_IoW-7UVKtf09aLu&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBTsoueVFG-EFFlISaHwvYGq7YLYhIej5awgH_IxwLk7SeMYEzFTWkTOVq&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBTsoueVFG-EFFlISaHwvYGq7YLYhIej5awgH_IxwLk7SeMYEzFTWkTOVq&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz2ulG92XS5yR4aIVbAIVPSqVsfdTZpKNoc462_XR8xaMUhbtXU4EohC4&s=10",
            "https://www.edusquadz.in/cdn/shop/files/aiwaft-4k-ptz-camera-pro-side-view-Black.webp?v=1774344975"
        });

        defs.add(new String[]{"Wireless Charging Pad", "1999", "3499", "Hot Deal",
            "15W Qi fast charging, compatible with all smartphones",
            "Electronics",
            "https://ptron.in/cdn/shop/products/51sH32iCy4L._SL1100.jpg?v=1632806065",
            "https://accessworld.in/cdn/shop/files/BoostChargePro_1.webp?v=1727162005&width=700",
            "https://xech.com/cdn/shop/files/xech-wireless-charger-compact-charging-pad-powerbase-lite-1500x1500_1.jpg?v=1762322706",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0N0MBxSzSCvHBcbJUQyzC8VQg3aTTbm_Wcb05XCYDe00PqYxCmfyB1WI&s=10",
            "https://shop.zebronics.com/cdn/shop/files/Zeb-WCP215-pic1.jpg?v=1761559815&width=1200"
        });

        defs.add(new String[]{"Smart LED Desk Lamp", "6499", "8499", null,
            "Auto-dimming, 5 color temperatures, USB charging port, touch controls",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGV6pbzu2k8JekybI1dYgnh4CEtygCl9dY8usi4LGn235QruWd9SnN3wKl&s=10",
            "https://xech.com/cdn/shop/files/xechlampslumos-368172.jpg?v=1740322875",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/table-lamp/7/x/o/led-desk-lamp-foldable-1200mah-battery-usb-charging-touch-enriched-2-original-imahk6a8gmvnzvst.jpeg?q=70",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/table-lamp/7/x/o/led-desk-lamp-foldable-1200mah-battery-usb-charging-touch-enriched-2-original-imahk6a8gmvnzvst.jpeg?q=70",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/table-lamp/7/x/o/led-desk-lamp-foldable-1200mah-battery-usb-charging-touch-enriched-2-original-imahk6a8gmvnzvst.jpeg?q=70"
        });

        defs.add(new String[]{"Bluetooth Speaker Portable", "4999", "7499", "New",
            "360-degree sound, IPX7 waterproof, 24-hour playtime",
            "Electronics",
            "https://www.myg.in/images/thumbnails/300/300/detailed/124/618-hB-ftdL._SL1500__ao4f-qy.jpg.png",
            "https://sony.scene7.com/is/image/sonyglobalsolutions/Primary-image_white?$primaryshotPreset$&fmt=png-alpha",
            "https://media-ik.croma.com/Croma%20Assets/Entertainment/Speakers%20and%20Media%20Players/Images/307854_0_n3buu6.png",
            "https://media-ik.croma.com/Croma%20Assets/Entertainment/Speakers%20and%20Media%20Players/Images/307854_0_n3buu6.png",
            "https://image.cdn.shpy.in/273060/main-image-1-1742194115205.jpeg?width=600&format=webp"
        });

        defs.add(new String[]{"Noise Cancelling Earbuds", "9999", "13999", "Best Seller",
            "Active noise cancellation, spatial audio, wireless charging case",
            "Electronics",
            "https://i.pcmag.com/imagery/roundups/02jmWgahGc1kOlR6u4u2Q9g-13..v1727913632.jpg",
            "https://uniquehubindia.in/cdn/shop/files/5.png?v=1776715672&width=1445",
            "https://uniquehubindia.in/cdn/shop/files/5.png?v=1776715672&width=1445",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsL3zObrlVObByX6IihzrLpAqWcyTVHmfKD-gz49a3xT2pVVRQZteMq3JJ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsL3zObrlVObByX6IihzrLpAqWcyTVHmfKD-gz49a3xT2pVVRQZteMq3JJ&s=10"
        });

        defs.add(new String[]{"Portable SSD 1TB", "7499", "10999", null,
            "Read speeds up to 1050MB/s, compact design, USB-C",
            "Electronics",
            "https://www.ebuyindia.in/cdn/shop/products/6_2e936509-4f44-4f26-8391-8cab89ee97c9_1200x1200.jpg?v=1613719759",
            "https://www.ebuyindia.in/cdn/shop/products/6_2e936509-4f44-4f26-8391-8cab89ee97c9_1200x1200.jpg?v=1613719759",
            "https://danmears.tv/wp-content/uploads/2021/11/SanDiskExtreme1TBSSD2-1024x1365.jpg",
            "https://starlite.com.gh/cdn/shop/files/sandisk-ssdportablepro-11.jpg?v=1690214460",
            "https://starlite.com.gh/cdn/shop/files/sandisk-ssdportablepro-11.jpg?v=1690214460"
        });

        defs.add(new String[]{"Smart Home Hub", "8499", "12999", "New",
            "Voice control, supports Zigbee/Z-Wave/Thread, Matter compatible",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo3NKuA8yQHhY9nH-sOe2myZAJw9lNLSCZzdvzXjbkGIhjO2smnHVcC6cZ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo3NKuA8yQHhY9nH-sOe2myZAJw9lNLSCZzdvzXjbkGIhjO2smnHVcC6cZ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUqXKHzsvgzfzavLwOmRDYGadS3eW5uYdHXJvLzHlnlgoJ2rrB5vFawo8&s=10",
            "https://images.samsung.com/is/image/samsung/es-feature-samsung-connect-home-et-wv523b-102391404?$FB_TYPE_A_MO_JPG$",
            "https://www.techtarget.com/rms/onlineImages/smartthings_hub_half_column_mobile.jpg"
        });

        defs.add(new String[]{"Gaming Mouse RGB", "3999", "5999", null,
            "25K DPI sensor, 6 programmable buttons, 70hr battery",
            "Electronics",
            "https://www.coconutlife.in/cdn/shop/files/145_134.jpg?v=1719853598",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2-_JYrmyB6JMPLeceB0wPZ-OYeHA-NwTZaSfW0bq5lw&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTamkPgtq25TFVl_yeNL3ilIljxykwFgpECGvsexnp0VQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf263om1zN5_sdtJkYJmgbNrmfNJ_BMDsi8naoobfQFw&s=10",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/mouse/3/7/n/rgb-led-usb-gaming-mouse-1500-dpi-high-accuracy-smooth-scroll-original-imahfxxnxyqxxkdx.jpeg?q=70"
        });

        defs.add(new String[]{"Tablet 10-inch", "21499", "27999", "Hot Deal",
            "2K display, octa-core processor, stylus support, 128GB storage",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqn8qZReV7TnmEZ5sjrMUm4jyuee985nhxQTxIvyQT3dnOwC9980XsxxW7&s=10",
            "https://i5.walmartimages.com/seo/Tablet-10-inch-Android-Tablet-PC-10-1-Touch-Screen-Quad-Core-Processor-32GB-ROM-2MP-8MP-Dual-Camera_e8d06080-d687-4b99-8d88-e9d5e4935324.0c3812e61a34b7718d21f9fabc2d4ce9.jpeg",
            "https://m.media-amazon.com/images/I/71ChssuxLCL._AC_UF1000,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZ1PowxMa1xeKrd7hPxx_5V5CQ9dpyCCsw37t3PI5Ypg&s=10",
            "https://m.media-amazon.com/images/I/71rLLGhm9UL.jpg"
        });

        defs.add(new String[]{"Smart Coffee Maker", "18499", "23999", null,
            "App-controlled, grind and brew, programmable schedules, 12-cup",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRboWBvtX2FjB23ojvw4xTY4VhRYWKL04nW91JP9y8nA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXsvpiGnvNl5nj0Y4MBAnQ2wKls047Adu5tV5zJmM2kQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStfyLsAIy3MuVtZnkoSQhcH3MZS_Ki4_c03k3ubuWVow&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeq7Mk92IPiiQPFBN4XFQtuW2rwexcRe9SUfzi6Qvf8A&s=10",
            "https://m.media-amazon.com/images/I/61dmSFjsykL._AC_SL1500_.jpg"
        });

        defs.add(new String[]{"Drone Mini 4K", "33999", "46999", "Best Seller",
            "4K camera, 30-min flight time, GPS, obstacle avoidance",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8i3E5ylsenVaSWpXls2bHKXj_PSqlE5SArQBLr3digHBj5NtB0jhYCf8D&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8i3E5ylsenVaSWpXls2bHKXj_PSqlE5SArQBLr3digHBj5NtB0jhYCf8D&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8i3E5ylsenVaSWpXls2bHKXj_PSqlE5SArQBLr3digHBj5NtB0jhYCf8D&s=10",
            "https://everse-assets.s3.amazonaws.com/productImageList/DJI+Mini+Series/Dji+Mini+4k/dji-mini-4k-004.webp",
            "https://m.media-amazon.com/images/I/61z0Ub4swkL._AC_UF1000,1000_QL80_.jpg"
        });

        defs.add(new String[]{"Electric Toothbrush Smart", "5999", "8499", null,
            "Sonic technology, AI brushing guide, 4 modes, 30-day battery",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIJo8qwTn2vH-YUQ_7eg62krMPaX522dDispE0adPOUA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRauythsL51QHae05a4t-5JO8aneCosD_IGESwRHZB7ne0gGep0PlF5YlQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRauythsL51QHae05a4t-5JO8aneCosD_IGESwRHZB7ne0gGep0PlF5YlQ&s=10",
            "https://images.meesho.com/images/products/799266753/lq06r_512.webp?width=512",
            "https://images.meesho.com/images/products/799266753/lq06r_512.webp?width=512"
        });

        defs.add(new String[]{"Power Bank 26800mAh", "2499", "4499", "New",
            "65W PD fast charge, dual USB-C, airplane safe, LED display",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLqta-y5r0O8vUiju0Vn6rAVqolEOu3T01pEwOyKyXqf06M6oenTmc7QY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8BqmtMQNnvAfcedmvuzZowSloUa4MEXJ4RQvYCdB98iTkVzudYQ2UCJ4i&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtdTPQqtI_6ykNsHpq3YAaSOh72guRQwHOWOVb5-EWYyG9ci-HiHjywXPo&s=10",
            "https://m.media-amazon.com/images/I/511zV4zbxSL._AC_SL1500_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1iCQwv-SaeqfAqQENYSEN8gWwS2uqX1ScZ-_-7pVqwg&s=10"
        });

        defs.add(new String[]{"Smart Thermostat", "14999", "21499", null,
            "AI learning, energy reports, voice control, remote access",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Gih6qdrBQ2crcZuEwvPXnNGDMBVmiXwJF9DNE11gwj4E6Kw22bdjYiLY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Gih6qdrBQ2crcZuEwvPXnNGDMBVmiXwJF9DNE11gwj4E6Kw22bdjYiLY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Gih6qdrBQ2crcZuEwvPXnNGDMBVmiXwJF9DNE11gwj4E6Kw22bdjYiLY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Gih6qdrBQ2crcZuEwvPXnNGDMBVmiXwJF9DNE11gwj4E6Kw22bdjYiLY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Gih6qdrBQ2crcZuEwvPXnNGDMBVmiXwJF9DNE11gwj4E6Kw22bdjYiLY&s=10"
        });

        defs.add(new String[]{"Ring Light 18-inch", "3499", "5499", "Hot Deal",
            "Dimmable LED, phone holder, tripod stand, 3 color modes",
            "Electronics",
            "https://5.imimg.com/data5/ANDROID/Default/2022/1/FM/BH/SG/41852469/product-jpeg.jpg",
            "https://5.imimg.com/data5/SELLER/Default/2023/7/328410462/BH/ZV/LS/62567820/18inch-rgb-1500.jpg",
            "https://m.media-amazon.com/images/I/615nlWeedUL.jpg",
            "https://5.imimg.com/data5/SELLER/Default/2020/8/JC/UN/AB/52782818/dsc00249-500x500.JPG",
            "https://image.made-in-china.com/2f0j00NMbcfOjGLBoY/Premium-Quality-Rl-18-Inch-Selfie-Ring-Light-Portable-LED-Photography-Ring-Light-Lamp-Video-Light-with-Tripod-Stand-Wholesale.webp"
        });
          defs.add(new String[]{"Keratin Hair Straightener", "5499", "8499", "Hot Deal",
            "Ceramic plates, adjustable temp, anti-static, auto shut-off",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXJCU0U1sS5MxErirkm-W5mGXz9yrrgUewosUOM0NTXA&s=10",
            "https://ae01.alicdn.com/kf/S104a27ff036d492d9342bfec989486a8D.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpI_Y6JeOK0YJqgi9VxMjVfFLNI1vDZsnXoctwh1ZeLfbX_yfenlD0KKo&s=10",
            "https://image.made-in-china.com/202f0j00cjtbUWVRvlqa/450-Degrees-Glossy-Titanium-Plate-Hair-Flat-Iron-Keratin-Hair-Straightener.webp",
            "https://havells.com/media/catalog/product/cache/a68cd95282f629852e6b9e296b7a5618/g/h/ghphhcblbk00_3.jpg"
        });
          defs.add(new String[]{"Hair Dryer Ionic Pro", "6499", "9999", "Hot Deal",
            "Ionic technology, 3 heat settings, concentrator and diffuser nozzles",
            "Electronics",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyRkn4z7mZORD0iXBDeWhQOerGrcztEL1huR9U7XuhjDGdKiNYwP1h2KI&s=10",
            "https://www.ikonicworld.com/cdn/shop/files/8904231022317_5_jpg.jpg?v=1781877899&width=360",
            "https://www.vgrofficial-eg.com/cdn/shop/files/vgr-v-409-professional-hair-dryer-2400w-negative-ionic_9.jpg?v=1771800600&width=1500",
            "https://s.alicdn.com/@sc04/kf/Hae696297ca8847a9a4ba74758a09019dQ.jpg",
            "https://cdn.dummyjson.com/product-images/beauty/hair-dryer/4.webp"
        });
        // ═══════════════════════════════════════════════════════════════
        // FASHION (18 products)
        // ═══════════════════════════════════════════════════════════════

        defs.add(new String[]{"Premium Leather Jacket", "15999", "21499", "Best Seller",
            "Genuine lambskin leather, slim fit, satin lining",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEu-_JrOxyiu_6Q6ONgXkqzPVrPPpbZ0rh6MKOMs92-AGpQWJ7fcDSxKY&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRM1plOH6X-dpFvcoCXfOs0ySWJd48IZQD5VgFrPwDNg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRM1plOH6X-dpFvcoCXfOs0ySWJd48IZQD5VgFrPwDNg&s=10",
            "https://tiimg.tistatic.com/fp/1/009/072/mens-leather-jackets-916.jpg",
            "https://images.stockcake.com/public/9/c/9/9c980813-71e7-407d-89a2-af96260c86fb_large/stylish-leather-jacket-stockcake.jpg"
        });

        defs.add(new String[]{"Classic Denim Jeans", "5499", "7499", null,
            "Slim fit, stretch denim, mid-rise, dark wash",
            "Fashion",
            "https://m.media-amazon.com/images/I/711qgP-l4KL._AC_UY1100_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6-o-Epdj4btox97QqRVfHH-L-HJoN_1yi7jhzkW8IhQ&s",
            "https://m.media-amazon.com/images/I/51Yp8H9lHIL._SY550_.jpg",
            "https://assets.myntassets.com/assets/images/2025/AUGUST/26/xrUunQCe_ecbe4828d6a3423ab9723c5bc8d87b97.jpg",
            "https://jimmyluxury.in/cdn/shop/files/IMG_8248copy_81e3efbe-9c62-4032-a634-8edaf5016224.jpg?v=1765434729&width=2048"
        });

        defs.add(new String[]{"Cotton Oxford Shirt", "3999", "5999", "New",
            "100% premium cotton, button-down collar, regular fit",
            "Fashion",
            "https://www.urbanofashion.com/cdn/shop/files/shirtsolregoxf-05-white-1_41b56b72-ebde-439d-afe0-202b5d10559c.jpg?v=1774711491",
            "https://www.powerlook.in/cdn/shop/files/14017211_3_cb2d7000-07d8-4bc7-92b7-2f0f5784a050.jpg?v=1762437623",
            "https://www.urbanofashion.com/cdn/shop/files/shirtsolregoxf-05-tealgrn-1_a60b1660-9b77-4555-b611-ea83f6427b89.jpg?v=1774711402",
            "https://fyva.in/cdn/shop/files/BD0A9670.jpg?v=1761674656&width=650",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgTQf4oE_hoHfZ82XheyyCFOkxfZThtRm7fYbqvy6OeCaAye2E0ltZ1pGK&s=10"
        });

        defs.add(new String[]{"Cashmere Blend Sweater", "10999", "14999", null,
            "Soft cashmere-wool blend, crew neck, ribbed cuffs",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf5Htk7nwYYotCpYvTyQxel7-sQxf1jiCbV0YbHRT_M8sf4Iz0uZmNub7D&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKhDIArc5xITpmuYe-_4AvzduQKlLa-OedSTi7H7u40NWXvhw0_ShS7U4&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdFCVSjilUafJE5-VwgkzeyszHbOIxrY078nPqWQcN3IK1gvSdDtN9w-yf&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKVhRm3CuPdPsWqQ2lsKGEcXEbCuYfSZR6OG2-6l2qfq8MMtd9sZ-6RJVN&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOvLSjtPHRza1at_MbwSzXTKaWwmPXJ8KNZ4rCn3WbQg&s=10"
        });

        defs.add(new String[]{"Running Sneakers Ultra", "11999", "16999", "Hot Deal",
            "Responsive cushioning, breathable mesh, lightweight design",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQICjjwmiiF-YupgFt_6Jmm9QrFF1JEv9iHuP3TakK0T34D0KTGV775WF0&s=10",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/shoe/9/q/q/7-ultraplus-7-0-cld-black-org-original-imahjhyjb4yrhk7z.jpeg?q=90",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/shoe/a/r/o/-original-imahmgphfgzsgj4d.jpeg?q=90",
            "https://cultstore.com/cdn/shop/files/iHfbiskKxxYCKQomF6Y7Ebkk.jpg?v=1726208445&width=1000",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPFR2j6i-vT2o-5T2byngAntoGEaf6nqPtI9zBaiPvi63h7RsA9Nclfow&s=10"
        });

        defs.add(new String[]{"Silk Tie Collection", "2999", "4999", null,
            "100% mulberry silk, hand-stitched, classic patterns",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRapsFbBT0LbVSAj4Ay7Pjym7se5Xtq0-kYE02ajn4rYPJfsy2SoQtT4lcl&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9M16GGpO1cnhvbmG6NPcFEA7u1TDxKOy-SPeLaNNAlA&s=10",
            "https://media.beefree.cloud/pub/bfra/vxvfqvf6/izg/rqz/wl6/Ties-Menu-Page-Image-06.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbNaV0VPHPnnDgxx_hMxtdYoWIO8ndmvplIBYHo5ITXCHDCcHOdAllveVi&s=10",
            "https://foxandchave.com/cdn/shop/files/45-803-Morris-Tulip-Pink-01-web.jpg?v=1776460798&width=533"
        });

        defs.add(new String[]{"Wool Overcoat Classic", "21499", "29999", "Best Seller",
            "Italian wool, double-breasted, satin lining, tailored fit",
            "Fashion",
            "https://frenchcrown.in/cdn/shop/files/TCB2912-DB-D1_1.jpg?v=1700646867&width=3500",
            "https://frenchcrown.in/cdn/shop/products/TCB2111-DB-D35_1.jpg?v=1700643498&width=1800",
            "https://m.media-amazon.com/images/I/61SZUc1V9gL._AC_UY1000_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2es5fU5eCveD2yurxPuEJTY0CX6LWs1LdczyIlarF05uv1gZdOPyriMuM&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIKQewMlV1igw9HCjQoJlLs3QnNzxxJ5gFZakxLIA9ycgHVQVK_-8E86bQ&s=10"
        });

        defs.add(new String[]{"Canvas Tote Bag", "2499", "3999", "New",
            "Organic cotton canvas, reinforced handles, inner pocket",
            "Fashion",
            "https://www.thesparklestory.in/cdn/shop/files/PersonalizedCanvasToteBag-CODNotApplicable_800x.jpg?v=1718618153",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_fIFSgDeKmbHrboQ_gQDOPCJcVgO-YiefoBBd8EhIDg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQc0Cut99NWLz6lvLT6WhYWVntLEcOaeEjoFS5PgD6Y2G83byZ3FRvwdBf1&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI7UiYZz0p57LJqVrEuUzEfukreK9KUnbAVcqMel23Y7Cgxicfp5oEhn-c&s=10",
            "https://www.handmakers.in/cdn/shop/products/20221223_123218.jpg?v=1672482368&width=1946"
        });

        defs.add(new String[]{"Aviator Sunglasses", "6499", "9999", null,
            "Polarized lenses, titanium frame, UV400 protection",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGTrIYHgz1lRmFQReV0GAliAeMI7m22N7QydQI3bXUuUQzmko1wFDeQD4&s=10",
            "https://opticone.ae/wp-content/uploads/2026/01/Optic-One-Sunglass-model-image_48z7gq48z7gq48z7.jpg",
            "https://www.randolphusa.com/cdn/shop/files/MatteBlackMilitary_800x.jpg?v=1723209236",
            "https://m.media-amazon.com/images/I/81WLJNHCwGL._AC_UY350_.jpg",
            "https://m.media-amazon.com/images/I/819KtKJ-ogL._AC_UY350_.jpg"
        });

        defs.add(new String[]{"Leather Belt Premium", "3499", "5499", null,
            "Full-grain leather, reversible, brushed steel buckle",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDRRZBWmSHkgpZCq6dqS6UEsnYi2tXUrHf5WjfRizOB7uRSzsx_uvc5Ys&s=10",
            "https://images.meesho.com/images/products/443104362/vrwck_512.webp?width=512",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnXCRPZQioZXpfzjdJsYW0J4iVD-MXujxzdHumhAWFxvslV_cMYzjVBiQ&s=10",
            "https://www.hammondsflycatcher.com/cdn/shop/files/BL8001_BRN-infographic-2_66d11a21-706c-4393-bbd5-8395180052bb.jpg?v=1762518405&width=1080",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6igLMJmzl5DfDuZZrI6Vse96gG8QRECq9w_84oeZcMpNiw5UxVwd2fKg&s=10"
        });

        defs.add(new String[]{"Linen Summer Dress", "7499", "9999", "Hot Deal",
            "100% linen, A-line silhouette, side pockets",
            "Fashion",
            "https://i.etsystatic.com/9617243/r/il/5d689d/2888023023/il_570xN.2888023023_h4zp.jpg",
            "https://assets.vogue.com/photos/68559ff6d7c69c33c9be7c39/2:3/w_960,h_1440,c_limit/best%20linen%20dresses%20(1).png",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXuA4hNZffUb0Hl2e9Tx2womSwgC_myaERMGa-nOTxmg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDW6dynOfvMP1BNkwaQv4Rs5jIUcVYDon-IQbATNuGeyF0hW0rR_xy2K8&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyhD8KVp44JmkWuzV1ceAaA5Tw-Ui7EheBnGX1Zz2sgn4IRKD1xnhm9QVg&s=10"
        });

        defs.add(new String[]{"Merino Wool Socks 6-Pack", "2499", "3999", null,
            "Temperature regulating, moisture wicking, cushioned sole",
            "Fashion",
            "https://m.media-amazon.com/images/I/71YmO7mbMDL.jpg",
            "https://m.media-amazon.com/images/I/61PvpTdUa0L._AC_UY1100_.jpg",
            "https://m.media-amazon.com/images/I/81+XKIFW-BL._SX569_.jpg",
            "https://m.media-amazon.com/images/I/81DeKwWHDeL._AC_UY350_.jpg",
            "https://m.media-amazon.com/images/S/aplus-media-library-service-media/4ac6412b-0d26-4607-9175-2a628182802b.__CR44,0,2528,1896_PT0_SX600_V1___.jpg"
        });

        defs.add(new String[]{"Waterproof Parka Jacket", "13499", "18999", "New",
            "3-layer waterproof shell, sealed seams, removable hood",
            "Fashion",
            "https://m.media-amazon.com/images/I/71AtYUkPBRL._AC_UY1100_.jpg",
            "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/24270848/2023/10/16/26c827f2-f826-46f2-85ef-17b94706d80c1697439662565-Columbia-Mens-Green-Landroamer-Parka-Full-Sleeve-Trekking-Hi-1.jpg",
            "https://m.media-amazon.com/images/I/711WEMJ8h6L.jpg",
            "https://m.media-amazon.com/images/I/71V3znOel5L._AC_SL1500_.jpg",
            "https://www.gooutdoors.co.uk/cdn/shop/files/go_767478_a_8a5dfa4d-b8af-4d82-bfa0-e7e60081f72e.jpg?v=1775122908&width=4000"
        });

        defs.add(new String[]{"Stretch Chino Pants", "4999", "6999", null,
            "Slim fit, stretch cotton blend, 8 color options",
            "Fashion",
            "https://www.tbase.in/cdn/shop/files/2_a74d06d5-6dd4-4916-9bb1-9a1707efd0d0.jpg?v=1742818485&width=2400",
            "https://nobero.com/cdn/shop/files/stormfront-8905816297465-D2C-1.jpg?v=1776147732",
            "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/products/pictures/item/free/original/000000410563420006/LeC9LTDmESv-000000410563420006_3.jpg?dpr=1",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjP4wwqm3QiusG6foD93g7HCIAI6cWFz_z_Aqhk4ujFVKwLdZ9HRjBlic&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHkxXjz1x26C-lPPdMlw-Y4UL3D0tAjxA6lJ2zFfTGEg&s=10"
        });

        defs.add(new String[]{"Pima Cotton Polo Shirt", "3499", "4999", "Best Seller",
            "Pima cotton pique, contrast collar, relaxed fit",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT131iuhayZu8K_IsApyqxCq8oqvAn1c9MgPt3kUNeI0Q&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCoIx1G30NzRugE2-T85uj8YH67tbkzu6Ru0k-m9reYiCqZ3Vn2fNKf9MC&s=10",
            "https://www.fairindigo.com/cdn/shop/files/BG_OF_04892_Deep_Teal_FW25_1189.jpg?v=1773279170&width=1946",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbk5SeaKPI-gU_IvC_igqyDaJsXhAdkZoF6r_pfgEMrGV1Ec8rTMGl6OCC&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnXsYsxTQCMGvxc6zTTo_gyrKziIMrlNvRcivJv0U1sw&s=10"
        });

        defs.add(new String[]{"Leather Messenger Bag", "8499", "12999", null,
            "Full-grain leather, padded laptop sleeve, adjustable strap",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQhSvnVcBgGhQdM36ppDfSrcMEX8CsdZudPBp-kd9g05iERRiOK0uxAdqR&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTFCRdhx8qdxAFbV27tWWDoruKQBCoAfUS1BCvLAaH_v49GVmorEr_idM&s=10",
            "https://www.craftshades.com/wp-content/uploads/2026/04/WhatsApp_Image_2026-04-12_at_4.52.20_PM.webp",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjY84knHzCSq8KnOdwzPUgSEzzXZoYcgm1qHHOKhALBA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9IxczVzfEVd00CT-_zAIclS2QSr1XY6kTf7fqXHqnYmv_D3abXd8N3ecw&s=10"
        });

        defs.add(new String[]{"Bamboo Fiber T-Shirt", "1999", "2999", "New",
            "Eco-friendly bamboo fabric, ultra-soft, anti-bacterial",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM7ATEcq9xhtEdJIccx3kI-o3myZAqmd5xffy44fUBe2uJ7BU9jBPBpO0&s=10",
            "https://wellbi.in/cdn/shop/files/11.png?v=1770878313&width=1080",
            "https://www.mystore.in/s/62ea2c599d1398fa16dbae0a/g/691dad548d2cd46d297f055d/whatsapp-image-2025-11-19-at-4-45-08-pm-1024x1024.jpeg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdqw_OYL99mfDfyPBR9kyMhypP1USQ5uInSqV5r6LR8Fw2e_g-uaFnPYw&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaelfhiBletLe3g4dU7GmNdPODWHOq0VVmWuDHvzl0Mw&s=10"
        });

        defs.add(new String[]{"Suede Chelsea Boots", "12999", "16999", "Hot Deal",
            "Italian suede, Goodyear welt, crepe rubber sole",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3hlNvflgNiySD2zMW7790Nl_b4xdc6hbXwx1E89yu00xvZaUzplEQ_r4&s=10",
            "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/G00118s3.jpg?im=Resize,width=750",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFzcvXFUNLyZMVbu6lpT3TsL5S-fzPj625JLTIJXBEKkJR9dyttpkmSn0&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXGFsFyy68rXLaKX7RiOv4vLQL6KOGnAS_HEpZ5IKr3Q&s=10",
            "https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/31638435/2024/11/23/b9aec0d1-92ae-4506-8359-1876fc54f9231732335370999-Styli-Men-Faux-Suede-Chelsea-Boots-8691732335370668-1.jpg"
        });
        defs.add(new String[]{"Gold Plated Jhumka Earrings", "1299", "1999", "Best Seller",
            "Traditional gold-plated jhumka earrings with elegant ethnic design",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFvTudr0FZjw17UU44f1o8TEUyjl636aqGbkdxG99iDeBjqrfbpM54RJw&s=10",
            "https://labelafreen.in/cdn/shop/files/rn-image_picker_lib_temp_b9462f28-8cd9-4ad3-ba49-c4c7971767a5.jpg?v=1776578276&width=3840",
            "https://m.media-amazon.com/images/I/91xTw1aq5LL._AC_UY1100_.jpg"
    });

    defs.add(new String[]{"American Diamond Necklace Set", "2499", "3999", "Hot Deal",
            "Premium American diamond necklace set with matching earrings",
            "Fashion",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGM2AsOAqP_e5qb4Z1qQZBVScOl3BqInHxRAYO0gxSokQGz5xP8zg1JGI&s=10",
            "https://cdn.exoticindia.com/images/products/original/jewelry/ja0665.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBCNbvKGqUet3z7fzQuT61U1ozu6Jr8tvLLVQLIjlobu4rn-iuSXHFkXFh&s=10"
    });

    defs.add(new String[]{"Silver Plated Chain Necklace", "999", "1499", "New",
            "Stylish silver-plated chain necklace suitable for everyday wear",
            "Fashion",
            "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/2026/MARCH/29/jz59mXML_f497c736573c47409add76a18f1684bd.jpg",
            "https://accessorizelondon.in/cdn/shop/products/MA-58266391001_1.jpg?v=1681212560",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGOaL-gecpu25CHSUGtexJi8G_Pkz_oSCRZVCcWyS9lEZhgpcEVNiBEjO_&s=10"
    });


    defs.add(new String[]{"Rose Gold Bracelet for Women", "1499", "2299", null,
            "Elegant rose gold bracelet with premium crystal finish",
            "Fashion",
            "https://m.media-amazon.com/images/I/71NbkTQGTML.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo1SU9k4c1R1tl4jGr_QPYb-v73Z6-m65_GnHh-sA2rroT9ABwl3WY9Fxp&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfAfMkMMIwJ5wvNemX6eRGV-uCiy97sY9Bbr5xeXMIaHplRVHfcefsdap1&s=10"
    });

    defs.add(new String[]{"Pearl Drop Jhumka Earrings", "899", "1499", "Trending",
            "Beautiful pearl drop jhumka earrings for festive occasions",
            "Fashion",
            "https://www.adorebypriyanka.com/cdn/shop/products/WhatsAppImage2022-12-20at6.00.44PM_2.jpg?v=1747566262&width=1080",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfJibON5B9Nh4m0zgsZlfxtL9nlyci--tutcKcbojs5i_y4WMTBRr6gaE&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7NL645GDfRfQ0FAruSl0o2TJLO2O5ZhwcHwHZeSQKcGjtHYMsYv5dZfKw&s=10"
    });

        // ═══════════════════════════════════════════════════════════════
        // SPORTS (16 products)
        // ═══════════════════════════════════════════════════════════════

        defs.add(new String[]{"Yoga Mat Premium", "2999", "4999", "Best Seller",
            "6mm thick, non-slip, eco-friendly TPE, carrying strap",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQboCEblbx_R7TNf6jCXog_Ccv-e88VRLoRlRXG_ZvhXBKc9M3pfe5BoPA&s=10",
            "https://cultstore.com/cdn/shop/files/1P_94f55581-2bdd-459a-927c-8234804396e1.jpg?v=1767095376&width=1080",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRejxEX8GAeK52OBe-R7F4mgyexg1z1a1Y8J0j0f8NNIQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD3LrMSfBaAhz38RwFFPO96beUtYdc6pn3KkCU0VPcwrf4NRCf_N6YHH4&s=10",
            "https://images.meesho.com/images/products/780601336/t4agb_512.jpg"
        });

        defs.add(new String[]{"Adjustable Dumbbells Set", "16999", "24999", "Hot Deal",
            "5-52.5 lbs per dumbbell, quick-change mechanism",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBgf6KqAmcW4gweYidzyGSsbcrwnOgRib005O5u5Nhxg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0l6We7u9DZ_NmksyP_9M1aSEfrTNctaUxoZNG1f377Vxu7C9pwJ6nZemH&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf9QQWi1qJxpUQisO6qUubJs3cocyvfJJ2XUz0OE3W7Q8ic4oyx95Gob6v&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8NqNwnBXTZbMsBwAyeASVBR9x_VEdAL5Fu-lcRXbyvxdS4evNyTPKKC8B&s=10",
            "https://m.media-amazon.com/images/I/611A37H1D2L.jpg"
        });

        defs.add(new String[]{"Cycling Jersey Pro", "5499", "7499", null,
            "Moisture-wicking, 3 rear pockets, reflective elements",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSm6FbzsJYsThP4k9luVCh6wjgEu7UTyi-hmVCPn7KHdw&s=10",
            "https://aerodoc.in/cdn/shop/files/BoraGreemJerseyFront.jpg?v=1716619101",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJh_-noehk3jxAteTvZl0iwEFq8zMlNX3Qviiu_-Cr6g2pmibj1ZAOUYd5&s=10",
            "https://aerodoc.in/cdn/shop/files/halfsleeveswithbibshortsfront_e5d4fa2a-396e-4699-8334-60a70170710d.jpg?v=1716726219",
            "https://images.squarespace-cdn.com/content/v1/5c6d81d87d0c91244a74be71/1576233750501-JYH4P910YZNTDH29L316/Deceuninck+-+Quick-Step+kit+modelled+by+Remco+Evenepoel"
        });

        defs.add(new String[]{"Resistance Bands Set", "1999", "3499", "New",
            "5 resistance levels, latex-free, door anchor included",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_xgCbMrorAOC2BaFMHlm5-XMNTcZi-ygIBSKLv2vfwFh9PN-g2bfeMqE&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROGr8x88mDzAwVSliJVtzpXuilbActAkhoGqEu9S28N_TFIysWxmIUoZ5U&s=10",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/resistance-tube/q/q/g/resistance-bands-kit-for-strength-and-flexibility-for-home-gym-original-imahjfkadtjaejc9.jpeg?q=70",
            "https://m.media-amazon.com/images/I/71-87y93B+L._AC_UF894,1000_QL80_.jpg",
            "https://i5.walmartimages.com/seo/ProsourceFit-Tube-Resistance-Bands-Set-w-Attached-Handles-for-Fitness_e9dae7c4-3966-462e-86ce-849eb8b2a075.a698431768a89e4377ec143cdb82d89e.jpeg"
        });

        defs.add(new String[]{"Trail Running Shoes", "10999", "14499", null,
            "Vibram outsole, waterproof Gore-Tex, responsive cushion",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi_h-P-PO0N4vgUe-0E7eGj8FAqMqozjE0GVv9IINjEQyGTICMkRNHSrY&s=10",
            "https://www.columbiasportswear.co.in/cdn/shop/files/BL7473-024-1.jpg?v=1772103189",
            "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/29913345/2024/9/5/212b3928-7f12-4499-98f2-d8beb241658d1725519937231-ASICS-Men-Sports-Shoes-7951725519936932-1.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKqGYODSx-MSoV7V2PRtza1oS_Z5h0he2wXW84mSnbOoOjYXcNiN_nFeH7&s=10",
            "https://cdn.mos.cms.futurecdn.net/QxyTSpbo2jtAFXaKYJ7JYa.jpg"
        });

        defs.add(new String[]{"Smart Jump Rope", "2499", "4499", "New",
            "LCD counter, adjustable length, ball bearing handle",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM8vQgEUq_EINmaWYh8u9qx2v2Sf9fI15TfEIBSi8ZK7mAP6ynuyspGzGi&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHBya5wjU_v1f0s5GDK_VB3C7ai4KEAIdOudhscFrxpYdji_pc_gLq3Yg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ_l6pg0VSALJGiL8RhNRmqf7M9ami2HZfB0tNzqDEydIHw80nvVUk5ik&s=10",
            "https://www.hitopfitness.com/cdn/shop/products/1.jpg?v=1662629615",
            "https://m.media-amazon.com/images/I/614NGooDuZL._AC_UF350,350_QL80_.jpg"
        });

        defs.add(new String[]{"Insulated Water Bottle", "2499", "3999", null,
            "Vacuum insulated, 32oz, keeps cold 24hrs hot 12hrs",
            "Sports",
            "https://www.thinkitchen.in/cdn/shop/files/ZK141-304.jpg?v=1689160458",
            "https://www.calvy.in/uploads/product/68db7fe6a80e2.png",
            "https://img.kwcdn.com/product/fancy/1ad717b5-7623-4b67-b169-0f44420f0248.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRESskTXT-DuLtNiqkdNpGix-qweFOLP13kBoq8JdN4dH-drgYjdYsvWO53&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBgm4c4Gm7hJrOedM4WqKk2okVztOM_x7PpMCbgskEoA&s=10"
        });

        defs.add(new String[]{"Compression Shorts Pro", "2999", "4499", "Best Seller",
            "4-way stretch, moisture management, flatlock seams",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT35sJUdxK5KUwUOhcWj6-eC_eeKGwP9lQnjOqNQs4GIiDuz7ePlTAmmms&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgRD5V9dGAtBUxHb5IjSuu4h50AEugqcDf0ybC2orQxieK5aVGMyfk4x-C&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHQz4pekiZeovSnDeBD-eqc7G_IMgMT1Sx_JZs9RwUhmVs8VGpZdue_bYO&s=10",
            "https://romjee.com/cdn/shop/files/Screenshot2024-10-04132735.jpg?v=1728028668",
            "https://rukminim2.flixcart.com/image/180/240/xif0q/short/x/m/x/m-men-s-compression-sports-shorts-half-tights-ninq-original-imahgjerskhk4ks3.jpeg?q=90"
        });

        defs.add(new String[]{"Swimming Goggles Elite", "1499", "2499", null,
            "Anti-fog, UV protection, adjustable nose bridge",
            "Sports",
            "https://speedo.com.au/dw/image/v2/BDFS_PRD/on/demandware.static/-/Sites-speedo-master-catalog/default/dw5e30f3a7/images/8_12818/8_12818002BST_2.jpg?sw=800&sh=800",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-8hI7NmcRN_0RymQ0DAj9uApdBo1HL4WVfX7RpZy35DPz2N_eglS5fT0f&s=10",
            "https://images-eu.ssl-images-amazon.com/images/I/71+N3NMWtmL._AC_UL600_SR600,600_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkH--_qIRGMYLjnhtjHWWxYKJE0sWh46LPZKmakigH9g&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThjf8_QE4afXQz2n-R6mr4sLDRCs65x0qFse1CuegdqymQ584_3yIGkbVP&s=10"
        });

        defs.add(new String[]{"Foam Roller Recovery", "1999", "3499", "New",
            "High-density EVA foam, textured surface, 18-inch",
            "Sports",
            "https://m.media-amazon.com/images/I/61Lh5jbBwdL._AC_UF1000,1000_QL80_.jpg",
            "https://i0.wp.com/www.muscleandfitness.com/wp-content/uploads/2014/06/Runner-Foam-Rolling-His-Calf-Muscle-On-Track-Course.jpg?quality=86&strip=all",
            "https://hips.hearstapps.com/hmg-prod/images/young-man-stretching-himself-on-a-foam-roller-royalty-free-image-1748339115.pjpeg?crop=0.670xw:1.00xh;0.311xw,0&resize=640:*",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGUmzcBGWyMHvS49tG6O8w8pwTQRPJ7JgegCPl8aRKkg&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTt6x8ksu7iygHL7NQw0Z60-Q8njL1dceV20u6DGdWs3WhsSqs-uAwOTww&s=10"
        });

        defs.add(new String[]{"Boxing Gloves 12oz", "3999", "5999", null,
            "Genuine leather, multi-layer foam, wrist support",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdbMa7roNYt7s8ggPXG2yCCjyEk3c988yJEDaU9pi3jQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu-3I1h8UDCSuOHswVKq7hJV64iULB1yNPD-hJ-6vH3Q&s=10",
            "https://m.media-amazon.com/images/S/aplus-media-library-service-media/73daa232-cd0a-48f1-93f7-85ddbe641274.__AC_SR166,182___.jpg",
            "https://m.media-amazon.com/images/I/81LhhGAwCQL._AC_UF894,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTSIHU_4blohJmC_2bGamy2MC15MtGMZWnc4UkwwON1NtyAeVQfe4J-eKy&s=10"
        });

        defs.add(new String[]{"Hiking Backpack 40L", "7499", "10999", "Hot Deal",
            "Waterproof, ventilated back panel, rain cover included",
            "Sports",
            "https://jainsonsumbrella.com/cdn/shop/files/25D76661-F5D3-4E39-88CC-09B41079D6B5_800x.jpg?v=1763719218",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfcBt7kcvpBYw46N9YB3HxUAuYg0_30h1ti5Qn6CDaE1O29McaMR0wEqE&s=10",
            "https://m.media-amazon.com/images/I/81orEOt2kpL._AC_SL1500_.jpg",
            "https://adventureworx.in/wp-content/uploads/2024/02/zero-rucksack-40l-black-1-1000x1500.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb79aRcc3gIfSlf_gXF-_o2_RTSqjOvSZEXu3xYFv9UsSbuZCGQDBoJL2Z&s=10"
        });

        defs.add(new String[]{"Tennis Racket Carbon", "13499", "18999", null,
            "Full carbon frame, 100 sq in head, pre-strung",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkgKtknjv7WVg9MuqENSlGhJPUseXVom0UPE2ThO0sWieRV0PsaySaXCQ&s=10",
            "https://www.vector-x.com/cdn/shop/files/Hurricane_1.jpg?v=1776401157",
            "https://5.imimg.com/data5/YK/FG/ED/SELLER-6708054/lawn-tennis-racket-500x500.jpg",
            "https://gophersport.com/media/catalog/product/g/-/g-52225-midsizejunior23inaluminum-ce-1-plp.jpg?optimize=low&bg-color=255,255,255&fit=bounds&height=360&width=360&canvas=360:360",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYqN4rMB1xK82F5dZRVKBqT4yNDRka-lfhCyo9KolzCOs6D7-WsWrfu1g&s=10"
        });

        defs.add(new String[]{"Fitness Tracker Band", "4999", "6999", "Best Seller",
            "Heart rate, sleep tracking, 14-day battery, waterproof",
            "Sports",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8sKR4khyXYunEoWsVC4ob2cKc_rBDgL3ZofdDV8AGnw&s=10",
            "https://dy6o3vurind23.cloudfront.net/img/developerimg/choco_life_20161214074908_db/mebase/style4/small_2005160934145ebfb396a4a5c.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdBXCPSwPZpnlhxRUW840W1d9XwLvKdFy8ry7_m_4Q7apwLPmrstKv8mPG&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR5sq0I9mZUc2FoPxbuBrw2OzWg8NQQrciO1T799IAA_B5TyFwl8D9d9Hk&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZa7YjJxo98D4-LAfjDe59IbCHaid3Z6bZH23LxbOc_jfjZ5nCtwOGhJcJ&s=10"
        });

        defs.add(new String[]{"Kettlebell Cast Iron 20kg", "3499", "5499", null,
            "Single cast, vinyl coated, wide handle grip",
            "Sports",
            "https://bullrockfitness.com/wp-content/uploads/2023/03/cast_iron_kettlebell_14-1200x1200.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn6dkM9oG2HkO3eTB2WyVZ00aOdr1P20BLrMDqarAvtzeXJsvSMI4wYeY&s=10",
            "https://m.media-amazon.com/images/I/819VmWOHGYL.jpg",
            "https://m.media-amazon.com/images/I/71CDSvuhgQL._AC_UF350,350_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeonEadAWBr9-2_sRBuIYQq_aH3g_5ghH0lRQHKUjOWA&s=10"
        });

        defs.add(new String[]{"Ski Jacket Insulated", "16999", "23999", "New",
            "20K waterproof, Thinsulate insulation, helmet-compatible hood",
            "Sports",
            "https://www.peakperformance.com/ca/en/media/catalog/product/cache/47a61cd39417a8407e88c1f76cc311d9/article_images/G80496030/G80496030_d014b3f7a1fdb1147e48f0b35211e1fe.jpg?optimize=low&format=pjpg&auto=webp&width=1440&crop=3:4",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUnB17BeIehlY8bs3VM2tY_aJu4_VAaBIvKY4EatpH3laVrTqkOHIEFWU&s=10",
            "https://outdoor-ams.b-cdn.net/images/products/2087401-698/1760053789-2087401_698_1.jpg?width=600&sharpen=true",
            "https://m.media-amazon.com/images/I/71UpTG+ricL._AC_SX385_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvePo1hRW7FvSQCjdH8rU_1Qww-3OPB7GU1_3EQX_6HwDctdxDMz5tIN1E&s=10"
        });
        defs.add(new String[]{"Cricket Bat English Willow", "8499", "11999", "Best Seller",
        "Grade 2 English willow, lightweight, shock-absorbing handle",
        "Sports",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl2wyXOk1IiaMt9QTl_iSy2gawQsLsWLkGC5_aHwwhHw&s=10",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdTc_YqyWmR4Hu1KHFcjoDQJ4-nFdsBXkCJ4pxPP52U41LI9jKtdXPDdJG&s=10",
        "https://www.sportsuncle.com/image/cache/catalog/images/ss/ew_master_1000-3-1200x1200.webp"
        });
        defs.add(new String[]{"Leather Cricket Ball", "799", "1299", null,
        "Premium leather, hand-stitched, match quality",
        "Sports",
        "https://prokicksports.com/cdn/shop/files/2_fdc0d9e1-a610-47fd-85ae-137b75fe0d64.jpg?v=1764755251",
        "https://slugger.co.in/cdn/shop/files/11_330882a7-01bd-4967-8146-5a8665ef2c5f.jpg?v=1693554755",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSptXPeBVdzdqOwC-KcDuteZhK6rxzqOUSX2PD1ve0AOhcJ2_BgBft-_sU&s=10"
        });
        defs.add(new String[]{"Professional Volleyball", "1899", "2799", "Hot Deal",
        "Official size 5, soft touch PU leather, indoor & outdoor",
        "Sports",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsHjlAAUrT46iut-Rx4tAVecB9DjF2d_DQwWXE7O2u-B9qaMZf-yn8eFI&s=10",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXMPpSWN5lcGAy687aPpzxF6lKin70zXIgaxbW5bWG7_g_VAidNRqi54rK&s=10",
        "https://m.media-amazon.com/images/I/614isdSC8QL._AC_UF894,1000_QL80_.jpg"
        });

        defs.add(new String[]{"Basketball Indoor Outdoor", "2499", "3499", "Best Seller",
        "Official size 7, composite leather, superior grip",
        "Sports",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeQwJwHMxGDHG88DHbkkOemwmtJEM18-m0Kf3g4W67ruxqbLqgmicFhrA&s=10",
        "https://spaldingphilippines.com/cdn/shop/files/7-IN-1FPrecisionTF1000_1080x.jpg?v=1692694772",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlTSjj3LJ6cxyiKx5omRVAF3LQHwg_qkMgqkYbp1Nr4eYVnMU08dF8j6B6&s=10"
        });
        defs.add(new String[]{"Football Match Pro", "2199", "3299", "New",
        "FIFA size 5, TPU stitched panels, all-weather performance",
        "Sports",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-4PYFk-lzLXR595NtAm2B2mgcFlG61p0BojYgoTM5mv2uNDF0urMNJ34&s=10",
        "https://nwscdn.com/media/catalog/product/cache/h370xw370/c/l/clubfootball-configmain-swatches-robbie-request.jpg",
        "https://contents.mediadecathlon.com/p2770363/b5a6bc1d3e04102f0427a47d2a806dd3/p2770363.jpg"
});
        // ═══════════════════════════════════════════════════════════════
        // HOME & LIVING (18 products)
        // ═══════════════════════════════════════════════════════════════

        defs.add(new String[]{"Ergonomic Office Chair", "32999", "42499", "Best Seller",
            "Mesh back, lumbar support, adjustable arms, 4D headrest",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRLDwef9G0U0650_bsSSthLxjsgnEF9keufwWAZ2rvPEe7o1EUOLi9i6ET&s=10",
            "https://thesleepcompany.in/cdn/shop/files/Elite_Construction_Desk.png?v=1774007131&width=800",
            "https://m.media-amazon.com/images/I/71+gxodaSBL._AC_UF894,1000_QL80_.jpg",
            "https://vergo.online/cdn/shop/files/1.transform-prime-highback-office-chair-tealwhite1.webp?v=1760618046&width=1500",
            "https://www.nilkamaledge.com/cdn/shop/files/NKL_1260_f9090fdf-9f28-4459-8c42-9f1b1fbc5ac3.jpg?v=1731582503&width=1445"
        });

        defs.add(new String[]{"Memory Foam Mattress Queen", "49999", "74999", "Hot Deal",
            "12-inch, CertiPUR-US certified, cooling gel layer",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjPtKiDIlvfV2cT2bI-ruvfILwT6rm_7NW7nElFx8Uzw&s=10",
            "https://m.media-amazon.com/images/I/813hOFSUF3L._AC_UF894,1000_QL80_.jpg",
            "https://m.media-amazon.com/images/S/aplus-media-library-service-media/841ecede-78c4-4cb1-ad84-af38eeec04eb.__CR0,0,1500,1500_PT0_SX300_V1___.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgD9ct_x811Apa0VSo6B0wH4QThe3A7LAvz5tjb38NYTAwzNmdyn96v4I&s=10",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/bed-mattress/g/b/2/euro-top-single-8-30-72-dual-comfort-reversible-soft-medium-firm-original-imahzjf8xtdt8cgy.jpeg?q=70"
        });

        defs.add(new String[]{"Smart Air Purifier", "14999", "21499", null,
            "HEPA H13, app control, air quality sensor, quiet mode",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJQLpHENV8ehsK-JIZHRZBGibN0jMgFyyDRqGpAXSctw&s=10",
            "https://m.media-amazon.com/images/I/517ojnZ64ZL._AC_US750_.jpg",
            "https://m.media-amazon.com/images/I/81JTdKwJ7kL._AC_UF894,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHbZDNvxtK0YlPLoZnISEyCZst9vX9--kVimsWFrxzaien_FwfrLckCQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTh8UC0hVpdQFDBaOzPD1iY0Lser8GUvIoJlLAge7TBOUnrYDcFXy79iH03&s=10"
        });

        defs.add(new String[]{"Ceramic Dinnerware Set 16pc", "7499", "10999", "New",
            "Microwave and dishwasher safe, chip resistant, modern design",
            "Home & Living",
            "https://www.amalfieeceramics.com/cdn/shop/products/Paris-Absolute-Ceramic-Dinner-Set-of-16-Pcs-Amalfiee-Ceramics-1678930092.jpg?v=1678930093",
            "https://www.amalfieeceramics.com/cdn/shop/files/Venice-Ceramic-Dinner-Set-of-16-Pcs-Amalfiee-Ceramics-1683268102.jpg?v=1683268104",
            "https://www.amalfieeceramics.com/cdn/shop/products/Paris-Absolute-Ceramic-Dinner-Set-of-16-Pcs-Amalfiee-Ceramics-1678930107_1800x1800.jpg?v=1678930113",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKCEeJc4vz4vTczhHz0If_5U6fcsYKLQZ8MSZRsPMOhw&s=10",
            "https://m.media-amazon.com/images/I/51xQkxUSv8L._AC_UF894,1000_QL80_.jpg"
        });

        defs.add(new String[]{"Standing Desk Electric", "37999", "49999", "Best Seller",
            "Dual motor, memory presets, anti-collision, cable tray",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-Q_kLPoy8xa2VumcYgasiR95wBcmpsIGcgOCZX_W9Fg&s=10",
            "https://i0.wp.com/www.jin.net.in/wp-content/uploads/2025/06/J20-maple4-scaled.jpg?fit=1024%2C1024&ssl=1",
            "https://www.ergoyou.in/cdn/shop/files/M14_MapleWhiteFrame_4_1200x1200.jpg?v=1764142865",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcklpebnpIDMyDcdzLVoAIXrpVVvmp3tksvzMMOJFwbJsnt-bpj3ZoiQvd&s=10",
            "https://afcindustries.com/wp-content/uploads/2022/01/Dual-Tier-Standing-Desk-Height-Adjustable-771662-01.jpg"
        });

        defs.add(new String[]{"Robot Vacuum Cleaner", "27999", "37999", null,
            "LiDAR navigation, 5000Pa suction, self-emptying base",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSs1CNB7S-9kp0E1XOKyq6VoKFs5cRSmr1fC7mO5kyI0g&s=10",
            "https://m.media-amazon.com/images/I/81ETNR6s1hL._AC_UF350,350_QL80_.jpg",
            "https://jamesandco.in/wp-content/uploads/2024/09/61Vt8i4F8gL._SL1500.jpg",
            "https://ilifecare.in/cdn/shop/files/4_3737c666-d2a1-4883-aa6f-7fc809815d6f.jpg?v=1718193539&width=1500",
            "https://www.electrolux.com.au/globalassets/article/robotic-vacuum-cleaner-contender/robotic-contender-banner-mb.jpg?width=464"
        });

        defs.add(new String[]{"Weighted Blanket 15lbs", "4999", "7499", "New",
            "Glass beads, cotton cover, promotes better sleep",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBkMXoCnlKAswk0XhTjuHZnDxcZ2ittG55dv6-WRAkNw&s=10",
            "https://images-cdn.ubuy.ae/69b8eb42d47d41c4e4014baa-weighted-blanket-15lbs-for-adults-ultra.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZSpyut2DhspPHazz0nHKIki2Wyt_nGwFw7kue5VJyjeb0Avyz4-o1Hfsi&s=10",
            "https://m.media-amazon.com/images/I/716ucE69tUL._AC_UF894,1000_QL80_.jpg",
            "https://img.kwcdn.com/product/fancy/705a4cfc-d29f-46c3-b196-d32ad3f7c45e.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
        });

        defs.add(new String[]{"Bamboo Cutting Board Set", "2499", "3999", null,
            "3-piece set, juice groove, built-in handles, BPA free",
            "Home & Living",
            "https://m.media-amazon.com/images/I/91BhEbBANlL.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwPVPQR_4CFaqdSCvuBSoQc2rdTG_Dr_dAW-x1hUvOAFv3t-rFc08p9zqs&s=10",
            "https://myborosil.com/cdn/shop/files/Thinkness10mm1Set2.png",
            "https://media-uk.landmarkshops.in/cdn-cgi/image/h=750,w=750,q=85,fit=cover/homecentre/1000012208420-1000012208419_01-2100.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyqLA2FKsUYie0R34eOmQRISMP6X4pSqB_9gdLfFA0XzGPAvnWPi0eJNA&s=10"
        });

        defs.add(new String[]{"Smart Plug 4-Pack", "2499", "3999", "Hot Deal",
            "WiFi, voice control, energy monitoring, scheduling",
            "Home & Living",
            "https://m.media-amazon.com/images/I/61YCBrHdbqL.jpg",
            "https://images.thdstatic.com/productImages/f04b194d-11b8-4cbb-a2fe-f4d14825f54b/svn/defiant-electrical-plugs-connectors-hppa11awb4-d4_600.jpg",
            "https://9to5toys.com/wp-content/uploads/sites/5/2026/06/Linkind-Matter-Smart-Plug-with-Remote-4-pack.png?w=1600",
            "https://m.media-amazon.com/images/I/61T1rVhpMOL.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTs86s13fUCOcMEA0edfJFfixthb9K3d1UYXaUh7qrZ1TTMritWzPlaNZc&s=10"
        });

        defs.add(new String[]{"Espresso Machine Pro", "22999", "32499", null,
            "15-bar pump, milk frother, PID temperature control",
            "Home & Living",
            "https://sipologie.in/cdn/shop/files/IMG_8193-8.jpg?v=1778832319&width=2000",
            "https://costarcosmos.com/cdn/shop/files/master_5s_pro_1880d7cd-b579-4e4d-8d89-f5841aeee9e6.webp?v=1766588677&width=2048",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP1psUqIV1bZGsvy9H2Xd5IYpAMjgXY-IqyvZYs66wkRhmoDzwIS_AHKg&s=10",
            "https://coffeegeek.com/wp-content/uploads/2025/05/Ninja-Luxe-Cafe-Pro-1-1500x1000.jpg",
            "https://clivecoffee.com/cdn/shop/files/Lucca-A53-Pro-Espresso-Machine-Black-Lifestyle-by-Clive-Coffee-12_c1a434c8-0222-4593-9f76-8c0f005a350e.jpg?v=1769950272&width=640"
        });

        defs.add(new String[]{"Indoor Plant Collection", "3999", "5999", "New",
            "Set of 4 air-purifying plants, decorative pots included",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIA1Bbt0SE3mdC2E2m5qyFsbPtaBh_8LJ85P2JHoo-bl9tY3doXhl3vJCI&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0U_6EX-egBb2x-y9_8wePsAwKtYmbJzQ-5UvWNJKc6SDMsz-TxAb7I9mn&s=10",
            "https://media02.stockfood.com/largepreviews/NDM4NTAwMzYz/14145173-Collection-of-houseplants-in-a-small-room.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5a0xaiUalAs0788x5v2XGtP7DjXas3TZrUNXVjUZtUg&s=10",
            "https://phoenixlandscape.net/wp-content/uploads/2021/10/soho-home-x-leaf-envy-houseplant-collection-1-1616683598-scaled.jpg"
        });

        defs.add(new String[]{"Egyptian Cotton Sheet Set", "6499", "9999", null,
            "800-thread count, sateen weave, deep pocket fitted sheet",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcZ7I9SHh9mgOIXAUlfnGoxgpPmVac57IR4l1PDzyoNQ&s=10",
            "https://m.media-amazon.com/images/I/718qA32HebL._AC_UF894,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyDPGPwikuctm6ClIojNomtrVbHzx5YN3X7hDX-POGxw&s=10",
            "https://www.maspar.com/cdn/shop/products/bedsheet_19_43282.jpg?v=1754389953",
            "https://i.etsystatic.com/28042127/r/il/a9c35f/2971357787/il_570xN.2971357787_cwjh.jpg"
        });

        defs.add(new String[]{"Cast Iron Skillet 12-inch", "3499", "4999", "Best Seller",
            "Pre-seasoned, oven safe to 500F, pour spouts",
            "Home & Living",
            "https://m.media-amazon.com/images/I/71ZE-6tbfuL.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUE8YR87aExw08xK9IWtsmzeImoDKlUWtgLCWkt6rxhA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLA-ShTVGDCMh2f2_HW25--cn4OgvoBQekGMB1pWM13QZ4NT1f-__DjY&s=10",
            "https://www.pamperedchef.com/iceberg/com/product/100179-lg.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEdKwdwSyFidl0eggYW6j0PD6mMtThiKfcZxZVCSjw9g&s=10"
        });

        defs.add(new String[]{"LED Strip Lights 32ft", "1499", "2999", "New",
            "RGBW, app and voice control, music sync, cuttable",
            "Home & Living",
            "https://litverse.in/cdn/shop/files/Myproject-8_1_4b581516-721c-40e2-9daa-744e30bea9ee.jpg?v=1694799383",
            "https://m.media-amazon.com/images/I/71rlirVNTnL.jpg",
            "https://m.media-amazon.com/images/I/81FZQ3u223L._AC_UF350,350_QL80_.jpg",
            "https://images-cdn.ubuy.com.bd/658f1f6d80d5d11d9f4aeda0-32ft-16ft-led-strip-lights-5050-smd-rgb.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWnDEbX7UypZZmRFYeFXzj495ElHu6MI1YLmSZEztn1A&s=10"
        });

        defs.add(new String[]{"Blackout Curtains Pair", "3499", "5499", null,
            "100% blackout, thermal insulated, grommet top, 84-inch",
            "Home & Living",
            "https://m.media-amazon.com/images/I/71ri+Jte20L.jpg",
            "https://m.media-amazon.com/images/I/81muGoxlkCL._AC_UF894,1000_QL80_.jpg",
            "https://images-cdn.ubuy.qa/69b53d4ab628864ed80d544a-princedeco-100-blackout-curtains-54.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPxaY_SIXMuKGd9B7EkUUZnX1HHAxDX7-KU4Xyl1kJbWo7Qj-ApL-nhuLu&s=10",
            "https://m.media-amazon.com/images/I/7159ILDkB+L._AC_UF894,1000_QL80_.jpg"
        });

        defs.add(new String[]{"Stainless Steel Cookware 10pc", "12499", "18999", "Hot Deal",
            "Tri-ply construction, riveted handles, oven safe",
            "Home & Living",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRL4MrhIDmV3IWLUYHuvjduRvZ6kBhBB79QjsYMNNKRQizVQi9ur7P84cz&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSg7CZnCf1ls1wk1G6h5lxVqQfLDb0Va-QCVFD2Fc7bWMy2LJCa0hFBOk&s=10",
            "https://m.media-amazon.com/images/I/61uEbSKPeBL._AC_UF894,1000_QL80_.jpg",
            "https://m.media-amazon.com/images/I/61W7Fkph4QL._AC_UF350,350_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsuzOoLrEw0QMS4-aXcLqS6nd6QLraAVRSwN_GFlbidHYa29MKEkz8JUo&s=10"
        });

        defs.add(new String[]{"Aromatherapy Diffuser", "2499", "3999", null,
            "300ml capacity, 7 LED colors, auto shut-off, whisper quiet",
            "Home & Living",
            "https://auradecor.co.in/cdn/shop/products/MG_6399_1.jpg?v=1771910411&width=1946",
            "https://irishomefragrances.com/cdn/shop/files/Gold_copy.webp?v=1751867602&width=2048",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1TkCTmh9tZ5_tQwHXstTZsEGubf5CSjWFNPl2ygfQ38peqmVsAZtaR7yQ&s=10",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/air-purifier/p/s/1/5-19-cloudrain-aroma-diffuser-for-home-electric-humidifier-oil-original-imahcsqhgksty9va.jpeg?q=70",
            "https://irishomefragrances.com/cdn/shop/files/Artboard_3_ccaadebf-67e5-4182-aca4-faf4136bc91e.webp?v=1773123957&width=2048"
        });

        defs.add(new String[]{"Memory Foam Pillow 2-Pack", "2999", "4999", "New",
            "Cooling gel infused, adjustable loft, hypoallergenic",
            "Home & Living",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/pillow/y/h/d/10-orthocurve-pro-2-p-w-c5030-sleepyhug-enriched-0-original-imahgymtysueqxhw.jpeg?q=90",
            "https://m.media-amazon.com/images/I/71cFh9jiPnL._AC_UF894,1000_QL80_.jpg",
            "https://static.wixstatic.com/media/d4b760_f9468cc07cde47d888c0f1c14d962a81~mv2.jpg/v1/fill/w_480,h_480,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/d4b760_f9468cc07cde47d888c0f1c14d962a81~mv2.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVhY8Gvw7HTKoW5Vzap0BwlDquKco52wsBwLLTZPlklR7kFi1RzgqF5Qc&s=10",
            "https://m.media-amazon.com/images/I/71rMQX5G3ML._AC_UF350,350_QL80_.jpg"
        });

        // ═══════════════════════════════════════════════════════════════
        // BOOKS (14 products) - Using Open Library covers for famous books
        // ═══════════════════════════════════════════════════════════════

        // Clean Code by Robert Martin (OL ID: OL7353264M)
        defs.add(new String[]{"Clean Code - Robert Martin", "2999", "3999", "Best Seller",
            "A handbook of agile software craftsmanship, essential for developers",
            "Books",
            "https://m.media-amazon.com/images/I/81L+johQmlL._AC_UF1000,1000_QL80_.jpg",
            "https://media.licdn.com/dms/image/v2/D4D22AQE40pxpvtM58w/feedshare-shrink_800/feedshare-shrink_800/0/1731864948655?e=2147483647&v=beta&t=2rvF3eKQO5-Kn-bR6YButnv5U6Rg-gc_ZLV5MFNEY60",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVe3l1tG9aWr0OrPQWsg-2RsM2mUzb0AEqWwRpropXm8P4ipQiCrXd3WA&s=10",
            "https://www.clankart.com/user-uploads/advert/Clean_code1737786073450.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB23NwmtaP6gY19rJToCppmBpOjT2qHfoxFyg8-3GMwA&s=10"
        });

        // Atomic Habits by James Clear
        defs.add(new String[]{"Atomic Habits - James Clear", "1299", "1999", "Best Seller",
            "Tiny changes, remarkable results. The number 1 bestseller on habit building",
            "Books",
            "https://www.thezappybox.com/cdn/shop/files/atomic-habits_gallery_hi-res_01.jpg?v=1756984420&width=1080",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmvML9a_QtIh48hnCi7zt4MraKN_M8skku989tjp7dZCMfdvpavH5JiclG&s=10",
            "https://accidentallyretired.com/wp-content/uploads/2021/09/Atomic-Habits-by-James-Clear.jpg",
            "https://forwardfitnessstl.com/wp-content/uploads/2021/01/IMG_3207-scaled.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPC1AuQ-LQH1NkrDmCwqiA23FmtIwEpOdzOwdihtpWVQ&s=10"
        });

        // Design Patterns - GoF
        defs.add(new String[]{"Design Patterns - GoF", "3999", "5499", null,
            "Elements of reusable object-oriented software, the classic reference",
            "Books",
            "https://m.media-amazon.com/images/I/51nL96Abi1L._UF1000,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_JyhXdnux6K_mIih-Eh2ObJadM2EFUJorHsWNmIGhKA2aghiL9gEctoM&s=10",
            "https://img.youtube.com/vi/U9jz3omyb_Y/0.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqS0Eaak_YT4-zbVA2OnlqWcNDA2v6QpSblv_iEusBR0fvsALS_tfkAxk&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTzOhc7Ac6BLsNaytvZ62WJ4X-Lc93uKOkLduQePqWHQ&s"
        });

        // The Pragmatic Programmer
        defs.add(new String[]{"The Pragmatic Programmer", "3499", "4999", "New",
            "20th Anniversary Edition, from journeyman to master developer",
            "Books",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcJ8-HrZ26wMVsjaMbfme-j4VHOlIROGu02IZSK8MpsRfDswQ1Bf-vU0Po&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyAzo8P2e7zyikd-6BIdis6EgOxQ2HdsK7NrDa93L1vw&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrSzLttysMnNXaml6MYNoms1XHWmLSThnxiB5u2ALZcUL-LRXrH4ygW7s&s=10",
            "https://www.briansnotes.io/wp-content/uploads/2020/12/the-pragmatic-programmer-book-350x350.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBwQSjoLdRGSeFcbpjQ4TNR1AHMo_6gRobdjoA_5-kz_4h8ZGFDBZlwIK8&s=10"
        });

        // Sapiens by Yuval Harari
        defs.add(new String[]{"Sapiens - Yuval Harari", "1099", "1799", "Hot Deal",
            "A brief history of humankind, thought-provoking exploration of civilization",
            "Books",
            "https://www.bradshawfoundation.com/books/books/sapiens.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5QwmMMtZ4wizv_455if1CR3gplOKzxZd5h6J4NHqZPl4dPK8S2EzkRAo&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRztRZlem6fbsGrGifPoWqJI-7q_ydtq5MA5qshqjg11cf1BsHQp-SyFqEC&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFK0kgxYCm4d2YBSPN026qvNoM0ng034alRn8Fb8DEIxw2kK7nr9rx2Mo&s=10",
            "https://covers.openlibrary.org/b/id/8714649-S.jpg"
        });

        // Deep Work by Cal Newport
        defs.add(new String[]{"Deep Work - Cal Newport", "1199", "1999", null,
            "Rules for focused success in a distracted world",
            "Books",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTueyaNTym2bcQkNsgo_7k7mPN66ege0vhAXGjM6Ngd1w&s=10",
            "https://5.imimg.com/data5/SELLER/Default/2022/2/JN/OT/TH/147304712/whatsapp-image-2022-02-11-at-3-26-48-pm.jpeg",
            "https://i0.wp.com/itsmoreofacomment.com/wp-content/uploads/2021/01/CalNewportDeepWork.jpg?fit=2000%2C1200&ssl=1",
            "https://images.meesho.com/images/products/615239417/nxza7_512.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9HUEhGXDY3IgcPrneqwvQEj83cfJ6pi9NLQ_CmpxwRw&s=10"
        });

        // System Design Interview
        defs.add(new String[]{"System Design Interview", "2999", "4499", "Best Seller",
            "An insiders guide to system design, volumes 1 and 2 combined",
            "Books",
            "https://www.shroffpublishers.com/images/detailed/60/9789368082255.jpg",
            "https://m.media-amazon.com/images/I/61qzVb-+eAL._UF1000,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUgBv2CYXMdzoaFAFn2cyuRnPNHmZqb8t8-IAZ6Sms-Hm3xiSuYK1M9z-s&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa5eZUr0ularHUZhw_l2Jy7G4LfY6vftGjvzEtmatEvw&s=10",
            "https://cdn.prod.website-files.com/679133efa0c66af38238b632/6821b1265e218a05ad34fbd4_common-topics.png"
        });

        // Thinking Fast and Slow
        defs.add(new String[]{"Thinking Fast and Slow", "1299", "1999", null,
            "Nobel laureate Daniel Kahneman on how we think and decide",
            "Books",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/book/j/y/d/thinking-fast-and-slow-original-imahcfde5shdcv4y.jpeg?q=90",
            "https://static.wixstatic.com/media/ef8af1_7ef516561bbe4f6ba2ac6e0a52b5686a~mv2.jpg/v1/fill/w_695,h_854,al_c,q_85/Thinking-fast-and-slow.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnFrWzlM8ixx1um81mBHQSZicwhotKyJ-XdVicSdVxfQ&s=10",
            "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F9650dcba-0887-4297-b874-7eae32b0a634_726x529.png",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMYWK6CFdz0dlr_0XGDDplxWYiiRYv09zbVDxbuPEeyg&s=10"
        });

        // The Art of War by Sun Tzu
        defs.add(new String[]{"The Art of War - Sun Tzu", "699", "999", null,
            "Ancient Chinese military treatise, timeless strategy principles",
            "Books",
            "https://www.crossword.in/cdn/shop/files/71at6icBvrL._SL1500.jpg?v=1750329045",
            "https://cdn.kobo.com/book-images/fabf787b-ac84-48ef-bfaa-7a33f6b71656/1200/1200/False/the-art-of-war-186.jpg",
            "https://bharatlawhouse.in/wp-content/uploads/2024/12/71xJdnydklL._SY425_-1.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcrypb1WpImOncyjmMGbpBYFdAEr4FoNhSAyGjRNx-f_yV3ol7basr72Q&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcrypb1WpImOncyjmMGbpBYFdAEr4FoNhSAyGjRNx-f_yV3ol7basr72Q&s=10"
        });

        // Dune by Frank Herbert
        defs.add(new String[]{"Dune - Frank Herbert", "999", "1499", "Hot Deal",
            "Epic science fiction masterpiece, the greatest sci-fi novel",
            "Books",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7GLhhr_jZ-ZFQ6ljQHNtRsKO4rrTE0McAFYgKz60clQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjpzxq1tEJMUi9WQPapOqDpqgZJ23HDrHHwJUkl4D1UuQqWx-gPkrkGDU&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxLmMnRkIdnAtJwqjxsmthE7f15DZiOMyDsXrt4opauYtJ_QJCE5s-SefG&s=10",
            "https://substackcdn.com/image/fetch/$s_!pr17!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fe78bf586-4ce5-471a-af75-bdeb6f7757f2_1200x1850.jpeg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSbMQMOST76mGeSjpVhcvxDfeN5_p4YZu_yMQrg10HXRPUSm2eOBogBWM&s=10"
        });

        // JavaScript: The Good Parts
        defs.add(new String[]{"JavaScript The Good Parts", "2499", "3499", null,
            "Douglas Crockford's guide to the best features of JavaScript",
            "Books",
            "https://aestheticblasphemy.com/static/media/images/archive/JavaScript-TheGoodParts.jpg?itok=K3YlQY2x",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGLM22_qclhhHn_N8BKfD3hQyqo9gDWlGpmdqjlAHCAdImJVWFrczwbWTS&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpxY9ujCk-6TlH9n_9PkVeSXLos8bUfK0v-L3U6sE-89rSgYre03SfGks&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOV_wSXZu_g-3nhZ8QYGvOCo4kd4lqJdHM02SZsxa-v-OKGw4VWAvIAKM&s=10",
            "https://cdn.educba.com/academy/wp-content/uploads/2023/10/List-of-Top-10-JavaScript-Books.jpg"
        });

        // Rich Dad Poor Dad
        defs.add(new String[]{"Rich Dad Poor Dad", "1099", "1799", "New",
            "What the rich teach their kids about money that the poor do not",
            "Books",
            "https://m.media-amazon.com/images/I/81N9xAIkohL._AC_UF1000,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo-2K7llwRs6JD5bGTtM_wC-Brmg2kmMwdIJLt_n4o3qZ_yXV80a6JSw&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwURmRm5GPDDGKz-2zIbQ6X-zHUWtH_Z3AYMH9qQ4St9KzrI_utII4HVk&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0_upGFDtiU5mAylTEy-MRi67GcqId7WVFxGJRWWZxNQ&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXm8H_kKrkwYSLfAxI--g8izqdqpN_66IOKVWqX6acFV2B01UM5rc9jFs&s=10"
        });

        // Start With Why by Simon Sinek
        defs.add(new String[]{"Start with Why - Simon Sinek", "1199", "1799", null,
            "How great leaders inspire everyone to take action",
            "Books",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOYOSI-Bz1T41Q8EiVDpvS7VXyj5qWlqN8Gdh2Zd-5BqEr_l54hdZgM9CB&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW2hYZYEop3wmz_IGMz80gMHWHR6qTVqsJHg3FP2ZQAOesTNBv2fr6VP8&s=10",
            "https://media.licdn.com/dms/image/v2/D5612AQH4PvRyS7W7gw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1674102543887?e=2147483647&v=beta&t=Kd2C1gCQKGsC35Hsw4mvlUNd3NdGngKMx6vWGI0qTRs",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRtN9rQniID4mOCun5eQD007PKWCQ_ZVgzrb9yTauvPYBeJdSGkZNGxTVl&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLT9d27yBLLc_lQn20kblsCqxTPfEiL8wMEEjDsSYgF_3FItnagCmbh9dl&s=10"
        });

        // The Lean Startup
        defs.add(new String[]{"The Lean Startup", "1499", "2499", "New",
            "How constant innovation creates radically successful businesses",
            "Books",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwNjea1KGbQkQRj_ccOnULL6a7l8e4IZgfypn1fEQ8vg&s=10",
            "https://theleanstartup.com/images/methodology_innovation.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPnsDHsFZRwoSimucCF4OSZQBt2OMxks5Lo34QTW3s-Q&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR15IABM518CZlOHCAtGLxERIpqmKkzfyuMSBrb6tVnZKn0doj9UJPQPEo&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRDOF5W-9M3-0aN-MWiybTDWu4xDhRTsqu8waO2X7_qQyfXt6q-EgmvkM&s=10"
        });
           
        // ═══════════════════════════════════════════════════════════════
        // Hair & CARE (10 products)
        // ═══════════════════════════════════════════════════════════════

         defs.add(new String[]{"Organic Shampoo and Conditioner", "2499", "3999", null,
            "Sulfate-free, plant-based, suitable for all hair types",
            "Hair & Care",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEkGsiilpaHhkW0T4m3V86OMHEAtX1l-ThsE8vmmZ_UA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQFcKcDjGNfrjwvxus5SXgx4_yZd970D3irRGm5ryd14sdHyOWlZcBzOqn&s=10",
            "https://m.media-amazon.com/images/I/71WC98OVvxL._AC_UF350,350_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7VErRyku5jfBq-_J1EtaGHqLPKcEz7brg51MW3benbhXG4lSOOsPA0YbW&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9KmJui95Nj6qQBEwbM1P8IfH288MAY_zmsI2t8XY_oMR704LimYbp7kw&s=10"
        });
        defs.add(new String[]{"SPF 50 Sunscreen Lotion", "1299", "1999", null,
            "Broad spectrum, water resistant 80min, reef safe formula",
            "Hair & Care",
            "https://innovist.com/cdn/shop/files/5_Niacinamide_Fistimage.jpg?v=1770117662",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGg0K6NaZ8yYZVEkoi0rIviZqfjLEvtdYUn_9VxER2Jo7g2g7f3RWRB1Kc&s=10",
            "https://innovist.com/cdn/shop/files/4_4_1_ed2807aa-85f0-46cc-a5b1-503eeefbd85d.jpg?v=1770113567&width=720",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT92yAxetxLvZw61OGqkIZi_y0e49jrz6KofuP6waLdcESJcj0uDX5H2NYo&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4Yz7eF0FenrVdcv5XihgSffZX6OomDLlGXN0UTUlMCtF7MgOSd2NcoKre&s=10"
        });
         defs.add(new String[]{"Argan Oil Hair Treatment", "1499", "2999", "Best Seller",
            "100% cold-pressed argan oil, frizz control, shine enhancement",
            "Hair & Care",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJXsC540qtHCG7o89p1Zry-4_y8iYZdCufR9N_WlX9eXlt23-cmj_T2pU&s=10",
            "https://cdn.shopify.com/s/files/1/1121/0428/files/Argan_Hair_Collection_for_Deep_Conditioning_Argan_Hair_Products_for_Colored_hair_480x480.jpg?v=1716525374",
            "https://image.made-in-china.com/43f34j00kSAWHfIFLOGi/Free-Design-Available-Moroccan-Argan-Oil-Hair-Shampoo-and-Conditioner-Set-Nourishing-Formula-for-Smooth-Hair-Frizz-Free-Hair-Shampoo.webp",
            "https://olamor.in/cdn/shop/files/Argan_Oil_Hair_Therapy_AComparison_Debate_Image_1.jpg?v=1779342869&width=416",
            "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/2026/MAY/14/XyNP8Q4T_a0cd21fa24cc478ba63716a937c996a5.jpg"
        });
        defs.add(new String[]{"Dove Intense Repair Shampoo", "499", "699", "Best Seller",
            "Repairs damaged hair and reduces breakage with Keratin Repair Actives",
            "Hair & Care",
            "https://www.quickpantry.in/cdn/shop/products/dove-intense-repair-shampoo-quick-pantry-3.jpg?v=1772984328",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHWMlgWYwe4SlzS-lFlo-PBDkM8x_3cHnBTUfrixxubbLz8bVRav5HYpZM&s=10",
            "https://bfasset.costco-static.com/U447IH35/as/737rbp36h9bvcx3fwtnfb7qg/4000363407-847__1?auto=webp&format=jpg"
        });

        defs.add(new String[]{"Head & Shoulders Anti-Dandruff Shampoo", "399", "599", "Hot Deal",
                "Removes dandruff, relieves itchy scalp, and keeps hair fresh",
                "Hair & Care",
                "https://cdn11.bigcommerce.com/s-ilgxsy4t82/images/stencil/1280x1280/products/2100/3167/71FMlrA8TiL_1524e22d-09c5-49dc-a9e9-6f29726a3ea1__98079.1656624313.jpg?c=1&imbypass=on",
                "https://images-static.nykaa.com/media/catalog/product/a/c/ac6e47cHEADS00000004_9.jpg?tr=w-500",
                "https://rukminim2.flixcart.com/image/480/640/xif0q/shampoo/b/p/a/-original-imagztufsgy3ywz6.jpeg?q=90"
        });

        defs.add(new String[]{"L'Oréal Paris Total Repair Shampoo", "599", "799", "Top Rated",
                "Strengthens weak hair and repairs visible signs of damage",
                "Hair & Care",
                "https://m.media-amazon.com/images/I/613OaIVF-CL._AC_UF350,350_QL80_.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7-jtW1I0paLdhPfvA02vGuVJDwBZMYJp4TMF06DUimoH8rzV2O5u6vRA&s=10",
                "https://images-static.nykaa.com/media/catalog/product/a/c/ace06428901526588985_7.jpg?tr=w-500"
        });

        defs.add(new String[]{"Pantene Advanced Hair Fall Solution Shampoo", "549", "749", "Best Seller",
                "Reduces hair fall and nourishes hair from root to tip",
                "Hair & Care",
                "https://images.ctfassets.net/u7208a463x31/23O4rZtO71NCZhep9gfKkL/43a68edf530b85baf3663c3b733b5733/HFC_banner.jpg?fm=webp&w=750&q=70",
                "https://m.media-amazon.com/images/I/71H80yfMd0L.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRlDy2piIgiZPcedyJPLs7zhN1najKHKZRmPwulvAhepTY-65Pm01jK8x4&s=10"
        });

        defs.add(new String[]{"Tresemmé Keratin Smooth Shampoo", "649", "899", "Premium",
                "Controls frizz and leaves hair silky smooth with Keratin",
                "Hair & Care",
                "https://m.media-amazon.com/images/I/712KDD+O92L.jpg",
                "https://rukminim2.flixcart.com/image/480/640/xif0q/conditioner/o/q/x/-original-imahkkhrashwgh7z.jpeg?q=80",
                "https://m.media-amazon.com/images/I/61duYIizFBL._AC_UF350,350_QL80_.jpg"
        });

        defs.add(new String[]{"Mamaearth Onion Hair Fall Shampoo", "449", "649", "Organic",
                "Made with Onion Oil and Plant Keratin for stronger hair",
                "Hair & Care",
                "https://m.media-amazon.com/images/I/61gqnNffaqL._AC_UF1000,1000_QL80_.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTZXC8Bwj2t7tEHYntFPZgh0bOtR4qWHe6Y-GQ3ag2jNLM7fVsp3ETZ6aY&s=10",
                "https://media6.ppl-media.com/tr:h-235,w-235,c-at_max,dpr-2,q-40/static/img/product/181887/mamaearth-onion-hair-fall-shampoo-for-hair-growth-and-hair-fall-control-with-onion-oil-and-plant-keratin-250-ml_1_display_1779454023_9209a068.jpg",
        });

        defs.add(new String[]{"WOW Skin Science Apple Cider Vinegar Shampoo", "599", "799", "Natural",
                "Deep cleanses scalp and removes buildup with Apple Cider Vinegar",
                "Hair & Care",
                "https://m.media-amazon.com/images/I/61-kNn05+KL._AC_UF1000,1000_QL80_.jpg",
                "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/15344652/2023/10/14/5e76b002-003a-4bcd-a28d-84fd55451c021697269069523-WOW-SKIN-SCIENCE-Unisex-Apple-Cider-Vinegar-Shampoo-100-ml-7-2.jpg",
                "https://images-static.nykaa.com/media/catalog/product/8/5/8557d88WOWXX00000030_6.jpg?tr=w-500"
        });

        defs.add(new String[]{"Clinic Plus Strong & Long Health Shampoo", "299", "399", "Value Pack",
                "Milk protein formula for strong, healthy, and long hair",
                "Hair & Care",
                "https://images-static.nykaa.com/media/catalog/product/c/c/cca0475755928_9.jpg?tr=w-500",
                "https://images-static.nykaa.com/media/catalog/product/c/c/cca0475755928_6.jpg?tr=w-500",
                "https://cdn.ewshopping.com/uploads/product/product-1767136040622-hpg1c7bdrea.webp"
        });
        // ═══════════════════════════════════════════════════════════════
        // BEAUTY & CARE (14 products)
        // ═══════════════════════════════════════════════════════════════

        defs.add(new String[]{"Vitamin C Serum 30ml", "1999", "3499", "Best Seller",
            "20% vitamin C, hyaluronic acid, ferulic acid, brightening formula",
            "Beauty & Care",
            "https://fashioncolour.in/cdn/shop/files/Artboard7copy3.jpg?v=1768475979&width=1946",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZeMSMqr5y57M0wMl49hZ1l3UzyaNdONfnA0ZpJk8lxk8Cks1h17VraL0&s=10",
            "https://images.meesho.com/images/products/420971140/ww2lr_512.webp?width=512",
            "https://images.meesho.com/images/products/514840114/ictf7_512.webp?width=512",
            "https://images.meesho.com/images/products/420604221/umq9g_512.webp?width=512"
        });

        defs.add(new String[]{"Retinol Night Cream", "2499", "4499", "New",
            "0.5% retinol, peptides, anti-aging, suitable for sensitive skin",
            "Beauty & Care",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOwaUVQvsVvRCacrx20GEjJA0aY-hEeBO2JHX6ygGHnA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwEssBaFbDl5HE2nZ85RYk_fZlus6ymFQIMcKspuAkTN8LwGmp68t6NbvW&s=10",
            "https://media6.ppl-media.com/tr:h-750,w-750,c-at_max,dpr-2/static/img/product/409790/chemist-at-play-0-1-percentage-retinol-night-cream-reduces-fine-lines-wrinkles-and-sunspots-30-gm_4_display_1768316765_4c8343f1.jpg",
            "https://m.media-amazon.com/images/S/aplus-media-library-service-media/f85146a5-59ba-430c-9cec-1ffcd39ca092.__CR0,0,600,450_PT0_SX600_V1___.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1XgrkoSlgtLbuIJf323DO6ff1M8N6lp3tPX0UOVyynYoABh3TlHg8M-H7&s=10"
        });


        defs.add(new String[]{"Natural Lip Balm Set 6-Pack", "999", "1499", null,
            "Organic beeswax, shea butter, 6 fruity flavors",
            "Beauty & Care",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-9Qnn3rVPtBCktgzF-E_uW2pkCzhzUR5TO3mfqlB8wg&s=10",
            "https://m.media-amazon.com/images/I/61DQ0DOhPJL._AC_UF1000,1000_QL80_.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdD-IGhFAkUlhqG3j7B4Z7J6SqpnYgWO5B_GQXA9iXRA&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS48NrkCVrBkqoM_5Pz4mCtXkrhQv0CsjSgH_5ofMQAGa_wHyvNNYzmYLs&s=10",
            "https://m.media-amazon.com/images/I/71+GxrEtz8L._AC_UF894,1000_QL80_.jpg"
        });

        defs.add(new String[]{"Charcoal Face Mask 10-Pack", "1199", "1999", null,
            "Activated charcoal, deep pore cleansing, detoxifying",
            "Beauty & Care",
            "https://m.media-amazon.com/images/I/51-Af0vS8EL.jpg",
            "https://dr.rashel.in/cdn/shop/files/Charcoal_sheet_mask_c50b3b96-d66c-4d7b-b237-307ac6db8a33.jpg?v=1782735689&width=1946",
            "https://www.bbassets.com/media/uploads/p/l/40313062_1-himalaya-pollution-detox-charcoal-face-sheet-mask.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMt3B7uJ9bX-2o32BwLNtAgx3Vnmg924okl-uSjAGswQ&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfl56g19p0DPSuFm01UMh8M5shgONueVIqVqzAzWN05h5qcDEFlNYqQi7-&s=10"
        });

       

        defs.add(new String[]{"Electric Facial Cleansing Brush", "3999", "6499", "New",
            "Silicone bristles, 5 modes, IPX7 waterproof, USB-C charging",
            "Beauty & Care",
            "https://mumuso.co.in/cdn/shop/files/20240607_114918499_4442880a-3652-447d-8f2d-9ca23e6eeb8e.jpg?v=1753703937&width=1920",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCZhFyF7F-zEoFrmUN65WQLAnQyWRVsYMVWypFMUH6Ow&s=10",
            "https://5.imimg.com/data5/YL/TS/RI/SELLER-13995724/1-500x500.png",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo-UkNzBPhbvbzi9BcqBcf4gIJq8zPZkw4_CRRrJ_eBQB5_kGX0KMO_Oc&s=10",
            "https://ae-pic-a1.aliexpress-media.com/kf/Hb2497679bbe54ca5be4b316b6b704ca07.jpg"
        });

        
        defs.add(new String[]{"Jade Roller and Gua Sha Set", "1499", "2999", "Hot Deal",
            "Genuine jade stone, reduces puffiness, promotes circulation",
            "Beauty & Care",
            "https://m.media-amazon.com/images/I/71iJKKDDToL.jpg",
            "https://5.imimg.com/data5/SELLER/Default/2026/4/599678825/WU/DV/HT/38655213/jade-roller-and-gua-sha-set.jpeg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpJExO72nxo6Ib9MY_89DjmA-d27drYIoO6Pnc3Ga0pg&s=10",
            "https://cdn.kindlife.in/images/detailed/199/71gmKG40QKL._SL1500_.jpg?t=1756116962",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToR09rNhr7hAO1Nx870nMTbEl4dT0675heLPc0Bbrv-A&s=10"
        });

       

        defs.add(new String[]{"LED Face Mask Therapy", "7499", "12999", "New",
            "7 color LED, anti-aging, acne treatment, FDA cleared",
            "Beauty & Care",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb4IRzleE3H3B5TLh8knHqYnxF3q6z3cNsAgziauW-0w&s=10",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3W0nPH1DAY2cETYO0hC82-ehTjeVhoiTXAb5Q2wL2nHCdz8De3XIdqQE&s=10",
            "https://protouchskin.com/cdn/shop/products/3In1MaskListingImage_6.png?format=webp&quality=85&v=1768473218&width=1600",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ3ut8LOYWcuo5H1VbO8IEfe4PJoqlRAznSK3Ly9Ot92q8G8BtsPH3WSMP&s=10",
            "https://houseofbeautyindia.com/cdn/shop/files/How_to_Use_LED_Face_Mask_for_Best_Results.jpg?v=1775050017&width=1080"
        });

        defs.add(new String[]{"Cologne Discovery Set", "4999", "7499", null,
            "8 premium fragrances, 10ml each, travel case included",
            "Beauty & Care",
            "https://m.media-amazon.com/images/I/51SAjaIUxLL._AC_UF1000,1000_QL80_.jpg",
            "https://images-static.nykaa.com/media/catalog/product/9/3/93732bbFRAGA00000006_5a.jpg?tr=w-500",
            "https://inixio.in/cdn/shop/files/Inixio-mini-perfume-gift-set.webp?v=1773993850",
            "https://i.etsystatic.com/8212367/r/il/e0ef53/6927164444/il_570xN.6927164444_6fgi.jpg",
            "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw2d53b5f5/Y4001070/Y4001070_C400100392_E01_GHC.jpg?sw=800"
        });      

        defs.add(new String[]{"Eye Cream Anti-Aging", "2499", "3999", "Best Seller",
            "Peptide complex, caffeine, reduces dark circles and puffiness",
            "Beauty & Care",
            "https://m.media-amazon.com/images/I/71NVdjBPsnL._AC_UF1000,1000_QL80_.jpg",
            "https://m.media-amazon.com/images/I/71WeqJtoKML.jpg",
            "https://i5.walmartimages.com/seo/Olay-Retinol-24-Night-Eye-Cream-Fragrance-Free-Normal-Skin-0-5-fl-oz_2fc76af0-bbfd-48f3-923c-d755d2ac577e.6a0765634dbe423b63888d4c26f92ff0.jpeg?odnWidth=300&odnHeight=300&odnDpr=1&odnWebp=1",
            "https://i5.walmartimages.com/asr/a66471fb-c18e-4d55-ae23-748f3d376d0f.d2a1ed89774d8af5f026c69c14a26c5e.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF",
            "https://m.media-amazon.com/images/I/81g2f6UB3aL._AC_UF350,350_QL80_.jpg"
        });
        defs.add(new String[]{"Pilgrim 2% Alpha Arbutin Face Serum", "649", "899", "Best Seller",
            "Reduces pigmentation, dark spots, even skin tone with Alpha Arbutin & Hyaluronic Acid",
            "Beauty & Care",
            "https://images-static.nykaa.com/media/catalog/product/2/7/27564b0PILGR00000024_s1.jpg",
            "https://rukminim2.flixcart.com/image/480/640/xif0q/skin-treatment/i/e/w/-original-imahjzhgmm3apfhy.jpeg?q=90",
            "https://m.media-amazon.com/images/I/61oANvDx29L._AC_UF350,350_QL80_.jpg"
        });

        defs.add(new String[]{"PLIX Guava Glow Vitamin C Face Serum", "799", "1099", "Hot Deal",
            "Vitamin C, Niacinamide & Hyaluronic Acid for glowing and hydrated skin",
            "Beauty & Care",
            "https://images-static.nykaa.com/media/catalog/product/4/3/4316c13PLIXX00000170s_13.jpg?tr=w-500",
            "https://images-static.nykaa.com/media/catalog/product/4/3/4316c13PLIXX00000170s_4.jpg?tr=w-500",
            "https://m.media-amazon.com/images/I/61a+o1lbBPL._AC_UF350,350_QL80_.jpg"
        });

        defs.add(new String[]{"Minimalist 10% Niacinamide Face Serum", "599", "699", "Editor's Choice",
            "Controls excess oil, minimizes pores, improves skin texture",
            "Beauty & Care",
            "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/872e5e125ab544c7b7957ed176d4d583.jpg?dpr=3&format=auto&w=412",
            "https://manirambalwantrai.com/cdn/shop/files/7_5623c9b6-5c1f-4d71-8b56-3c423a163378_1100x.jpg?v=1682490755",
            "https://www.newu.in/cdn/shop/files/2_ef439d35-03d5-4d71-803b-546810a4e130_1024x1024.jpg?v=1706523989"
        });

        defs.add(new String[]{"The Derma Co 2% Salicylic Acid Face Serum", "699", "999", "New",
            "2% Salicylic Acid, reduces acne, blackheads and unclogs pores",
            "Beauty & Care",
            "https://rukmini1.flixcart.com/image/1500/1500/xif0q/skin-treatment/d/s/o/60-2-salicylic-acid-serum-with-witch-hazel-willow-bark-for-original-imah43f9d5wx8m9d.jpeg?q=70",
            "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/fef05b724c8e419299649c3947551a14.jpg?dpr=3&format=auto&w=412",
            "https://thedermaco.com/cdn/shop/files/9_11a637f6-fd71-4630-8b2d-c0694680db72.jpg?v=1782729928&width=1024"
        });

        // ── Build Product entities ──────────────────────────────────────
        Map<String, Category> catMap = new LinkedHashMap<>();
        for (String name : cats.keySet()) catMap.put(name, cats.get(name));

        List<Product> products = new ArrayList<>();
        for (String[] def : defs) {
            String name       = def.length > 0 ? def[0] : "Product";
            BigDecimal price  = new BigDecimal(def.length > 1 ? def[1] : "99.99");
            BigDecimal oldPr  = (def.length > 2 && def[2] != null) ? new BigDecimal(def[2]) : null;
            String badge      = def.length > 3 ? def[3] : null;
            String desc       = def.length > 4 ? def[4] : "";
            String catName    = def.length > 5 ? def[5] : "Electronics";
            String imgUrl     = def.length > 6 ? def[6] : "https://via.placeholder.com/600";
            String thumbUrl   = def.length > 7 ? def[7] : imgUrl;
            String g1         = def.length > 8 ? def[8] : imgUrl;
            String g2         = def.length > 9 ? def[9] : imgUrl;
            String g3         = def.length > 10 ? def[10] : imgUrl;

            double rating     = 3.5 + rng.nextDouble() * 1.5;
            int ratingCount   = 50 + rng.nextInt(950);
            int stock         = 10 + rng.nextInt(200);

            java.util.Map<String, String> specs = new java.util.HashMap<>();
            switch (catName) {
                case "Electronics":
                    specs.put("Brand", name.split(" ")[0]);
                    specs.put("Warranty", (1 + rng.nextInt(2)) + " Year(s)");
                    specs.put("Connectivity", name.toLowerCase().contains("wireless") || name.toLowerCase().contains("bluetooth") ? "Bluetooth 5.3" : "USB-C / Wired");
                    specs.put("Battery", name.toLowerCase().contains("wireless") || name.toLowerCase().contains("watch") || name.toLowerCase().contains("phone") ? "Up to " + (10 + rng.nextInt(30)) + " Hours" : "N/A");
                    specs.put("Weight", (150 + rng.nextInt(350)) + " g");
                    break;
                case "Fashion":
                    String[] sizes = {"S", "M", "L", "XL"};
                    specs.put("Size", sizes[rng.nextInt(sizes.length)]);
                    specs.put("Material", name.toLowerCase().contains("leather") ? "Genuine Leather" : (name.toLowerCase().contains("silk") ? "100% Silk" : "Premium Cotton Blend"));
                    specs.put("Fit", name.toLowerCase().contains("slim") ? "Slim Fit" : "Regular Fit");
                    specs.put("Care Instructions", name.toLowerCase().contains("leather") ? "Dry Clean Only" : "Machine Wash Cold");
                    break;
                case "Books":
                    String[] authors = {"Robert C. Martin", "Simon Sinek", "Yuval Noah Harari", "Cal Newport", "James Clear", "Frank Herbert"};
                    specs.put("Author", name.contains("-") ? name.substring(name.indexOf("-") + 1).trim() : authors[rng.nextInt(authors.length)]);
                    specs.put("Publisher", "Global Publishers");
                    specs.put("Language", "English");
                    specs.put("Pages", String.valueOf(250 + rng.nextInt(300)));
                    break;
                case "Beauty & Care":
                    specs.put("Skin Type", name.toLowerCase().contains("anti-aging") ? "Mature Skin" : "All Skin Types");
                    specs.put("Volume", (30 + rng.nextInt(170)) + " ml");
                    specs.put("Ingredients", name.toLowerCase().contains("natural") || name.toLowerCase().contains("organic") ? "Aloe Vera, Vitamin E, Essential Oils" : "Hyaluronic Acid, Niacinamide");
                    specs.put("Expiry", "24 Months from Manufacture");
                    break;
                case "Home & Living":
                    specs.put("Material", name.toLowerCase().contains("wood") ? "Engineered Wood" : (name.toLowerCase().contains("cotton") ? "100% Cotton" : "Premium Alloy/Ceramic"));
                    specs.put("Dimensions", (20 + rng.nextInt(80)) + " x " + (20 + rng.nextInt(40)) + " x " + (10 + rng.nextInt(30)) + " cm");
                    specs.put("Weight", (1 + rng.nextInt(9)) + "." + rng.nextInt(9) + " kg");
                    break;
                case "Sports":
                    specs.put("Material", name.toLowerCase().contains("carbon") ? "Carbon Fiber" : "High-Density Synthetic");
                    specs.put("Weight", (200 + rng.nextInt(300)) + " g");
                    specs.put("Usage", name.toLowerCase().contains("indoor") ? "Indoor Sports" : "Outdoor/Gym");
                    specs.put("Brand", name.split(" ")[0] + " Sports");
                    break;
                case "Hair & care":
                    specs.put("Hair Type", name.toLowerCase().contains("anti-aging")? "Mature hair" : "All Hair Type");
                    specs.put("Volume",(30 + rng.nextInt(70))+ " ml");
                    specs.put("Ingredients", name.toLowerCase().contains("natural") || name.toLowerCase().contains("organic") ? "Aloe Vera, Vitamin E, Essential Oils" : "Hyaluronic Acid, Niacinamide");
                    specs.put("Expiry", "24 Months from Manufacture");
                    break;
            }

            Product p = Product.builder()
                .name(name)
                .description(desc)
                .price(price)
                .oldPrice(oldPr)
                .stockQty(stock)
                .category(catMap.get(catName))
                .vendor(vendor)
                .badge(badge)
                .isActive(true)
                .specifications(specs)
                .ratingAvg(new BigDecimal(rating).setScale(1, RoundingMode.HALF_UP).doubleValue())
                .ratingCount(ratingCount)
                .build();

            // Primary image
            p.getImages().add(ProductImage.builder()
                .product(p).imageUrl(imgUrl).isPrimary(true).sortOrder(0).build());

            // Thumbnail
            p.getImages().add(ProductImage.builder()
                .product(p).imageUrl(thumbUrl).isPrimary(false).sortOrder(1).build());

            // Gallery
            p.getImages().add(ProductImage.builder()
                .product(p).imageUrl(g1).isPrimary(false).sortOrder(2).build());
            p.getImages().add(ProductImage.builder()
                .product(p).imageUrl(g2).isPrimary(false).sortOrder(3).build());
            p.getImages().add(ProductImage.builder()
                .product(p).imageUrl(g3).isPrimary(false).sortOrder(4).build());

            products.add(p);
        }

        productRepository.saveAll(products);
        log.info("Seeded {} categories and {} products successfully!", cats.size(), products.size());

        // ── Seed Vendor Orders (only if none exist) ─────────────────────────
        if (orderRepository.count() == 0 && !products.isEmpty()) {
            log.info("Seeding sample orders for vendor analytics...");
            List<Product> saved = productRepository.findAll();
            // Find or create a sample shopper user
            Role userRole2 = roleRepository.findByName("ROLE_USER").orElseGet(() ->
                roleRepository.save(Role.builder().name("ROLE_USER").build())
            );
            User shopper = userRepository.findByEmail("shopper@shopeasy.com").orElseGet(() -> {
                User u = User.builder()
                    .firstName("Sample").lastName("Shopper")
                    .email("shopper@shopeasy.com")
                    .password(passwordEncoder.encode("Shopper@123"))
                    .enabled(true).build();
                u.getRoles().add(userRole2);
                return userRepository.save(u);
            });

            String[] statuses = {"DELIVERED","DELIVERED","SHIPPED","CONFIRMED","PENDING","CANCELLED"};
            Random orderRng = new Random(99);
            for (int i = 0; i < 15; i++) {
                Product prod = saved.get(orderRng.nextInt(saved.size()));
                int qty = 1 + orderRng.nextInt(3);
                BigDecimal subtotal = prod.getPrice().multiply(BigDecimal.valueOf(qty));
                BigDecimal shipping = new BigDecimal("49");
                BigDecimal tax     = subtotal.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
                BigDecimal total   = subtotal.add(shipping).add(tax);

                com.shopeasy.entity.Order order = com.shopeasy.entity.Order.builder()
                    .user(shopper)
                    .status(com.shopeasy.entity.Order.OrderStatus.valueOf(statuses[i % statuses.length]))
                    .totalAmount(total)
                    .shippingAmount(shipping)
                    .taxAmount(tax)
                    .paymentMethod(com.shopeasy.entity.Order.PaymentMethod.COD)
                    .paymentStatus(com.shopeasy.entity.Order.PaymentStatus.PAID)
                    .shippingName("Test Customer " + (i + 1))
                    .shippingAddressLine1("123 Sample Street")
                    .shippingCity("Mumbai")
                    .shippingState("Maharashtra")
                    .shippingZip("400001")
                    .shippingCountry("India")
                    .build();

                OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(prod)
                    .vendor(prod.getVendor())
                    .quantity(qty)
                    .unitPrice(prod.getPrice())
                    .subtotal(subtotal)
                    .build();
                order.getItems().add(item);
                orderRepository.save(order);
            }
            log.info("Seeded 15 sample orders for vendor analytics.");
        }
    }
}
