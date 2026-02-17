# Products Page Implementation

## Yaradılan Fayllar

### 1. Route Files
- **src/routes/_app/products/index.tsx** - Əsas products səhifəsi route-u

### 2. Component Files
- **src/routes/_app/products/-components/ProductsList.tsx** - Məhsul siyahısı komponenti
- **src/routes/_app/products/-components/ProductForm.tsx** - Məhsul əlavə/redaktə forması
- **src/routes/_app/products/-components/ProductShow.tsx** - Məhsul detalları görüntüləmə
- **src/routes/_app/products/-components/ProductVariants.tsx** - Məhsul variantları idarəetmə
- **src/routes/_app/products/-components/VariantForm.tsx** - Variant əlavə/redaktə forması

### 3. Updated Files
- **src/components/layout/AppLayout.tsx** - Sidebar-a Products menu item əlavə edildi

## Funksionallıqlar

### Products (Məhsullar)
- ✅ **List** - Məhsul siyahısı (axtarış, filtrlər, pagination ilə)
- ✅ **Add** - Yeni məhsul əlavə etmə
- ✅ **Edit** - Məhsul redaktə etmə
- ✅ **Delete** - Məhsul silmə
- ✅ **Show** - Məhsul detallarına baxış

### Product Variants (Məhsul Variantları)
- ✅ **List** - Variant siyahısı (pagination ilə)
- ✅ **Add** - Yeni variant əlavə etmə
- ✅ **Edit** - Variant redaktə etmə
- ✅ **Delete** - Variant silmə

## Texnologiyalar

- **TanStack Query** - Data fetching və cache management
- **TanStack Router** - File-based routing
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## API Endpoints

### Products
- `GET /products/load` - Məhsul siyahısını çəkmək
- `GET /products/show/{id}` - Məhsul detallarını çəkmək
- `POST /products/store` - Yeni məhsul yaratmaq
- `PUT /products/update/{id}` - Məhsulu yeniləmək
- `DELETE /products/delete/{id}` - Məhsulu silmək
- `POST /products/change-active-status/{id}` - Məhsul statusunu dəyişmək
- `POST /products/change-featured-status/{id}` - Məhsul featured statusunu dəyişmək

### Product Variants
- `GET /product-variants/load` - Variant siyahısını çəkmək
- `GET /product-variants/show/{id}` - Variant detallarını çəkmək
- `POST /product-variants/store` - Yeni variant yaratmaq
- `PUT /product-variants/update/{id}` - Variantı yeniləmək
- `DELETE /product-variants/delete/{id}` - Variantı silmək
- `POST /product-variants/change-active-status/{id}` - Variant statusunu dəyişmək

## Translation Keys (Tərcümə açarları)

Aşağıdakı translation key-lər backend-də əlavə edilməlidir:

```
products
product
add_product
edit_product
product_details
delete_product
product_deleted_successfully
product_updated_successfully
product_created_successfully
error_deleting_product
error_saving_product

variants
variant
add_variant
edit_variant
delete_variant
variant_deleted_successfully
variant_updated_successfully
variant_created_successfully
error_deleting_variant
error_saving_variant

title
slug
sku
stock
price
discount_price
is_active
is_featured
status
active
inactive
featured
yes
no
brand
category
image
created_date
actions
details

add
edit
delete
update
create
cancel
close
search
page
previous
next
no_data_found
```

## Strukturun Xüsusiyyətləri

1. **TanStack Query** istifadəsi - Bütün data fetching operasiyaları TanStack Query ilə idarə olunur
2. **Type Safety** - TypeScript ilə tam type safety təmin edilmişdir
3. **Modal-based UI** - Bütün CRUD əməliyyatları modal pəncərələrdə aparılır
4. **Responsive Design** - Mobil və desktop üçün responsive dizayn
5. **Error Handling** - Bütün API çağırışlarında error handling mövcuddur
6. **Toast Notifications** - Uğurlu və uğursuz əməliyyatlar üçün bildirişlər
7. **Debounced Search** - Axtarış funksiyası debounce ilə optimize edilmişdir
8. **Pagination** - Həm products, həm də variants üçün pagination

## Proyektin Ümumi Strukturuna Uyğunluq

- ✅ File-based routing (TanStack Router)
- ✅ TanStack Query for data management
- ✅ Shadcn/ui components
- ✅ Tailwind CSS for styling
- ✅ TypeScript for type safety
- ✅ Consistent folder structure (routes/_app/products/-components/)
- ✅ Reusable components (Modal, DeleteModal, etc.)

## İstifadə

1. Aplikasiya işə salındıqda `/products` route-una keçid edə bilərsiniz
2. Sidebar-da "Products" menu item-i görünəcək
3. Məhsullar siyahısı açılacaq və CRUD əməliyyatlarını apara biləcəksiniz
4. Hər məhsulun detallarına baxarkən variant idarəetmə tab-ı da mövcuddur

## Qeydlər

- Bütün API endpoint-ləri mövcud `products.ts` query faylında təyin edilmişdir
- Variant əməliyyatları tam funksional şəkildə işləyir
- Modal pəncərələr Escape düyməsi ilə bağlana bilər
- Bütün formlar validation-a malikdir
