import  path from 'path';
import {test,expect} from "@playwright/test"
import  {waitFor}  from '@testing-library/react';

const UI_URL="http://localhost:5173";

test.beforeEach(async({page}) => {

    await page.goto(UI_URL);
    await page.getByRole("link",{name:"Sign In"}).click();
    await expect(page.getByRole("heading",{name:"Sign In"})).toBeVisible();
    await page.locator("[name=email]").fill("1@gmail.com");
    await page.locator("[name=password]").fill("1234567");
    await page.getByRole("button",{name:"Login"}).click();
    await expect(page.getByText("Sign in Successful!")).toBeVisible();
});

test("should allow user to add a hotel",async({page})=>{
    await page.goto(`${UI_URL}/add-hotel`);

    await page.locator('[name="name"]').fill("Test Hotel");
    await page.locator('[name="city"]').fill("Test city");
    await page.locator('[name="country"]').fill("Test country");
    await page.locator('[name="description"]').fill("Test description");
    await page.locator('[name="pricePerNight"]').fill("100");
    await page.selectOption('select[name="starRating"]',"3");
    await page.getByText("Budget").click();
    await page.getByLabel("Free Wifi").check();
    await page.getByLabel("Parking").check();
    await page.locator('[name="adultCount"]').fill("2");
    await page.locator('[name="childCount"]').fill("2");
    await page.setInputFiles('[name="imageFiles"]', [
        path.join(__dirname, "files", "1.jpg"),
        path.join(__dirname, "files", "2.jpg"),
      ]);
    
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByText("Hotel Saved!")).toBeVisible();
})

test("should display hotels",async({page})=>{
 await page.goto(`${UI_URL}/my-hotels`);

 await expect(page.getByText("Test Hotel")).toBeVisible();
 await expect(page.getByText("Test description")).toBeVisible();
 await expect(page.getByText("Test city")).toBeVisible();
 await expect(page.getByText("Test country")).toBeVisible();
 await expect(page.getByText("Budget")).toBeVisible();
 await expect(page.getByText("₹100 per night")).toBeVisible();
 await expect(page.getByText("2 adults, 2 children")).toBeVisible();
 await expect(page.getByText("3 Star Rating")).toBeVisible();
 await expect(
    page.getByRole("link", { name: "View Details" }).first()
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Add Hotel" })).toBeVisible();
});
test("should edit hotel", async ({ page }) => {
  await page.goto(`${UI_URL}/my-hotels`);

  await page.getByRole("link", { name: "View Details" }).first().click();

  await page.waitForSelector('[name="name"]', { state: "attached" });
  await expect(page.locator('[name="name"]')).toHaveValue("Test Hotel");
  await page.locator('[name="name"]').fill("Test Hotel UPDATED");
  await page.getByRole("button", { name: "Save" }).click();
  //await page.waitForTimeout(1000);
  await expect(page.getByText("Hotel Saved!")).toBeVisible();

  await page.reload();

  await expect(page.locator('[name="name"]')).toHaveValue(
    "Dublin Getaways UPDATED"
  );
  await page.locator('[name="name"]').fill("Test Hotel");
  await page.getByRole("button", { name: "Save" }).click();
});