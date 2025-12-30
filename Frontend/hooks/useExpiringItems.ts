import { useState, useEffect, useCallback } from 'react';
import { getMyRefrigerators } from '@/service/fridge';

interface ExpiringItemsCount {
  expiringDishes: number;
  expiredDishes: number;
  expiringIngredients: number;
  expiredIngredients: number;
  totalExpiring: number;
  totalExpired: number;
}

export const useExpiringItems = () => {
  const [expiringCount, setExpiringCount] = useState<ExpiringItemsCount>({
    expiringDishes: 0,
    expiredDishes: 0,
    expiringIngredients: 0,
    expiredIngredients: 0,
    totalExpiring: 0,
    totalExpired: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const calculateExpiringItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyRefrigerators();

      // Parse response
      let refrigeratorsData: any[] = [];
      if (Array.isArray(response)) {
        refrigeratorsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        refrigeratorsData = response.data;
      } else if (response && typeof response === 'object' && response.id) {
        refrigeratorsData = [response];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);

      let expiringDishes = 0;
      let expiredDishes = 0;
      let expiringIngredients = 0;
      let expiredIngredients = 0;

      refrigeratorsData.forEach((fridge) => {
        // Kiểm tra món ăn
        const dishes = fridge.fridgeDishes || fridge.dishes || [];
        dishes.forEach((dish: any) => {
          // Chỉ tính các món có stock > 0 (chưa dùng)
          if (dish.stock > 0 && dish.expiration_date) {
            const expiryDate = new Date(dish.expiration_date);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
              expiredDishes++;
            } else if (expiryDate <= threeDaysLater) {
              expiringDishes++;
            }
          }
        });

        // Kiểm tra nguyên liệu
        const ingredients = fridge.fridgeIngredients || fridge.ingredients || [];
        ingredients.forEach((ingredient: any) => {
          // Chỉ tính các nguyên liệu có stock > 0 (chưa dùng)
          if (ingredient.stock > 0 && ingredient.expiration_date) {
            const expiryDate = new Date(ingredient.expiration_date);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
              expiredIngredients++;
            } else if (expiryDate <= threeDaysLater) {
              expiringIngredients++;
            }
          }
        });
      });

      setExpiringCount({
        expiringDishes,
        expiredDishes,
        expiringIngredients,
        expiredIngredients,
        totalExpiring: expiringDishes + expiringIngredients,
        totalExpired: expiredDishes + expiredIngredients,
      });
    } catch (error) {
      // Set to zero on error
      setExpiringCount({
        expiringDishes: 0,
        expiredDishes: 0,
        expiringIngredients: 0,
        expiredIngredients: 0,
        totalExpiring: 0,
        totalExpired: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateExpiringItems();
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      calculateExpiringItems();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [calculateExpiringItems]);

  return {
    expiringCount,
    loading,
    refresh: calculateExpiringItems,
  };
};

