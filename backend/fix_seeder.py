import re

# We will read DataSeeder.java, extract the category arrays and the photo IDs, and merge them.
# Then we will write the new DataSeeder.java.

with open('c:/Users/skala/OneDrive/Desktop/Project/shopeasy/backend/src/main/java/com/shopeasy/config/DataSeeder.java', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace lines 86 to 332 and 335 to 392
# Actually, let's just write the exact replacement string for the entire block from line 86 to 392.
# We'll parse the arrays first.

def extract_array(name):
    pattern = r'String\[\]\[\] ' + name + r' = \{(.*?)\};'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return []
    items = re.findall(r'\{(.*?)\}', match.group(1), re.DOTALL)
    res = []
    for item in items:
        parts = []
        for p in re.finditer(r'(".*?"|null)', item):
            parts.append(p.group(1))
        if len(parts) >= 5:
            res.append(parts)
    return res

categories = [
    ('electronics', 'Electronics'),
    ('fashion', 'Fashion'),
    ('sports', 'Sports'),
    ('home', 'Home & Living'),
    ('books', 'Books'),
    ('beauty', 'Beauty & Care')
]

# Extract current photo IDs from the map
photo_map = {}
for cat_name in ['Electronics', 'Fashion', 'Sports', 'Home & Living', 'Books', 'Beauty & Care']:
    pattern = r'categoryImages\.put\("' + cat_name + r'", new String\[\]\{(.*?)\}\);'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        photos = re.findall(r'"(photo-.*?)"', match.group(1))
        photo_map[cat_name] = photos
    else:
        photo_map[cat_name] = []

new_block = """        // ── Product Definitions (100 products across 6 categories) ──────
        Random rng = new Random(42);
        List<Object[]> productDefs = new ArrayList<>();
"""

for var_name, cat_label in categories:
    items = extract_array(var_name)
    photos = photo_map[cat_label]
    new_block += f'\n        String[][] {var_name} = {{\n'
    for i, item in enumerate(items):
        photo_id = f'"{photos[i % len(photos)]}"'
        new_block += f'            {{{item[0]}, {item[1]}, {item[2]}, {item[3]}, {item[4]}, {photo_id}}},\n'
    new_block += f'        }};\n'
    new_block += f'        for (String[] e : {var_name})\n'
    new_block += f'            productDefs.add(new Object[]{{e[0], e[1], e[2], e[3], e[4], e[5], "{cat_label}"}});\n'

new_block += """
        // ── Create Product entities ─────────────────────────────────────
        List<Product> products = new ArrayList<>();
        for (Object[] def : productDefs) {
            String name        = (String) def[0];
            BigDecimal price   = new BigDecimal((String) def[1]);
            BigDecimal oldPrice = def[2] != null ? new BigDecimal((String) def[2]) : null;
            String badge       = (String) def[3];
            String desc        = (String) def[4];
            String photoId     = (String) def[5];
            String catName     = (String) def[6];

            double rating = 3.5 + rng.nextDouble() * 1.5;
            int ratingCount = 50 + rng.nextInt(950);
            int stock = 10 + rng.nextInt(200);

            // Primary URL
            String primaryUrl = "https://images.unsplash.com/" + photoId + "?w=600&h=600&fit=crop&auto=format&q=80";

            Product p = Product.builder()
                .name(name)
                .description(desc)
                .price(price)
                .oldPrice(oldPrice)
                .stockQty(stock)
                .category(cats.get(catName))
                .vendor(vendor)
                .badge(badge)
                .isActive(true)
                .ratingAvg(new BigDecimal(rating).setScale(1, RoundingMode.HALF_UP).doubleValue())
                .ratingCount(ratingCount)
                .build();

            // Primary image
            ProductImage primaryImg = ProductImage.builder()
                .product(p)
                .imageUrl(primaryUrl)
                .isPrimary(true)
                .sortOrder(0)
                .build();
            p.getImages().add(primaryImg);

            // Gallery images using standard unsplash transformations (no random sig)
            String[] transforms = {
                "&fit=crop&w=600&h=600&rect=100,100,400,400", // simulated zoom/crop
                "&fit=crop&w=600&h=600&rect=50,50,500,500", // different crop
                "&fit=crop&w=600&h=600&q=90" // different quality/compression
            };
            for (int g = 1; g <= 3; g++) {
                ProductImage galleryImg = ProductImage.builder()
                    .product(p)
                    .imageUrl("https://images.unsplash.com/" + photoId + "?auto=format" + transforms[g-1])
                    .isPrimary(false)
                    .sortOrder(g)
                    .build();
                p.getImages().add(galleryImg);
            }

            products.add(p);
        }
"""

start_marker = "// ── Product Definitions (100 products across 6 categories) ──────"
end_marker = "        productRepository.saveAll(products);"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_block + content[end_idx:]
    with open('c:/Users/skala/OneDrive/Desktop/Project/shopeasy/backend/src/main/java/com/shopeasy/config/DataSeeder.java', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced block.")
else:
    print("Markers not found.")
