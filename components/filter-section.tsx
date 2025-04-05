"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FilterSectionProps {
  onFilterChange?: (filters: Record<string, string | number[] | boolean | string[]>) => void
}

// Define filter options based on the dataset
const GENDER_OPTIONS = ["All", "Men", "Women", "Boys", "Girls", "Unisex"]
const MASTER_CATEGORY_OPTIONS = ["All", "Apparel", "Accessories", "Footwear", "Personal Care"]
const SUB_CATEGORY_OPTIONS = {
  Apparel: ["All", "Topwear", "Bottomwear", "Innerwear", "Dress", "Loungewear and Nightwear", "Saree", "Apparel Set"],
  Accessories: ["All", "Watches", "Bags", "Belts", "Wallets", "Eyewear", "Jewellery", "Scarves", "Headwear", "Socks"],
  Footwear: ["All", "Shoes", "Sandal", "Flip Flops"],
  "Personal Care": ["All", "Fragrance", "Lips", "Nails", "Skin Care", "Makeup"],
}
const ARTICLE_TYPE_OPTIONS = {
  Topwear: ["All", "Shirts", "Tshirts", "Kurtas", "Sweatshirts", "Tops", "Jackets", "Sweaters", "Blazers", "Waistcoat"],
  Bottomwear: ["All", "Jeans", "Trousers", "Track Pants", "Shorts", "Skirts", "Capris"],
  Shoes: ["All", "Casual Shoes", "Sports Shoes", "Formal Shoes", "Flats", "Heels"],
  Bags: ["All", "Handbags", "Clutches", "Backpacks", "Laptop Bag", "Trolley Bag", "Duffel Bag"],
}
const COLOR_OPTIONS = [
  "All",
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Grey",
  "Navy Blue",
  "Brown",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Beige",
  "Maroon",
  "Olive",
  "Silver",
  "Gold",
  "Copper",
  "Teal",
]
const USAGE_OPTIONS = ["All", "Casual", "Formal", "Sports", "Ethnic", "Travel", "Party"]
const SEASON_OPTIONS = ["All", "Summer", "Winter", "Fall", "Spring"]

export function FilterSection({ onFilterChange }: FilterSectionProps) {
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [gender, setGender] = useState<string>("All")
  const [masterCategory, setMasterCategory] = useState<string>("All")
  const [subCategory, setSubCategory] = useState<string>("All")
  const [articleType, setArticleType] = useState<string>("All")
  const [color, setColor] = useState<string>("All")
  const [usage, setUsage] = useState<string>("All")
  const [season, setSeason] = useState<string>("All")
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  // Get available sub-categories based on master category
  const availableSubCategories =
    masterCategory !== "All"
      ? ["All", ...(SUB_CATEGORY_OPTIONS[masterCategory as keyof typeof SUB_CATEGORY_OPTIONS] || [])]
      : ["All"]

  // Get available article types based on sub-category
  const availableArticleTypes =
    subCategory !== "All" && ARTICLE_TYPE_OPTIONS[subCategory as keyof typeof ARTICLE_TYPE_OPTIONS]
      ? ["All", ...ARTICLE_TYPE_OPTIONS[subCategory as keyof typeof ARTICLE_TYPE_OPTIONS]]
      : ["All"]

  // Reset sub-category when master category changes
  useEffect(() => {
    setSubCategory("All")
  }, [masterCategory])

  // Reset article type when sub-category changes
  useEffect(() => {
    setArticleType("All")
  }, [subCategory])

  // Use a callback to handle filter application
  const handleApplyFilters = useCallback(() => {
    if (!onFilterChange) return

    const newFilters: Record<string, string | number[] | boolean | string[]> = {}

    if (gender !== "All") newFilters.gender = gender
    if (masterCategory !== "All") newFilters.masterCategory = masterCategory
    if (subCategory !== "All") newFilters.subCategory = subCategory
    if (articleType !== "All") newFilters.articleType = articleType
    if (color !== "All") newFilters.baseColour = color
    if (usage !== "All") newFilters.usage = usage
    if (season !== "All") newFilters.season = season
    if (selectedColors.length > 0) newFilters.selectedColors = selectedColors
    if (priceRange[0] > 0 || priceRange[1] < 1000) newFilters.priceRange = priceRange

    onFilterChange(newFilters)

    // Update URL with filter parameters
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("filters", encodeURIComponent(JSON.stringify(newFilters)))

    // Update URL without refreshing the page
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`
    window.history.pushState({ path: newUrl }, "", newUrl)
  }, [
    gender,
    masterCategory,
    subCategory,
    articleType,
    color,
    usage,
    season,
    selectedColors,
    priceRange,
    onFilterChange,
  ])

  const handleResetFilters = () => {
    setGender("All")
    setMasterCategory("All")
    setSubCategory("All")
    setArticleType("All")
    setColor("All")
    setUsage("All")
    setSeason("All")
    setSelectedColors([])
    setPriceRange([0, 1000])

    if (onFilterChange) {
      onFilterChange({})
    }
  }

  const toggleColorSelection = (colorValue: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorValue) ? prev.filter((c) => c !== colorValue) : [...prev, colorValue],
    )
  }

  return (
    <div className="w-full border rounded-md p-3 border-input bg-background">
      <div className="space-y-4">
        <Accordion type="single" collapsible defaultValue="categories" className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger className="text-base font-medium py-2">Categories</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm">
                  Gender
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="bg-background border-input text-foreground h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input text-foreground max-h-60">
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterCategory" className="text-sm">
                  Category
                </Label>
                <Select value={masterCategory} onValueChange={setMasterCategory}>
                  <SelectTrigger id="masterCategory" className="bg-background border-input text-foreground h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input text-foreground max-h-60">
                    {MASTER_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory" className="text-sm">
                  Sub Category
                </Label>
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger id="subCategory" className="bg-background border-input text-foreground h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input text-foreground max-h-60">
                    {availableSubCategories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleType" className="text-sm">
                  Article Type
                </Label>
                <Select value={articleType} onValueChange={setArticleType}>
                  <SelectTrigger id="articleType" className="bg-background border-input text-foreground h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input text-foreground max-h-60">
                    {availableArticleTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="attributes">
            <AccordionTrigger className="text-base font-medium py-2">Attributes</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm">
                    Color
                  </Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger id="color" className="bg-background border-input text-foreground h-8 text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-input text-foreground max-h-60">
                      {COLOR_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage" className="text-sm">
                    Usage
                  </Label>
                  <Select value={usage} onValueChange={setUsage}>
                    <SelectTrigger id="usage" className="bg-background border-input text-foreground h-8 text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-input text-foreground max-h-60">
                      {USAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season" className="text-sm">
                    Season
                  </Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger id="season" className="bg-background border-input text-foreground h-8 text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-input text-foreground max-h-60">
                      {SEASON_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Price Range</Label>
                  <div className="pt-2 px-1">
                    <Slider
                      defaultValue={[0, 1000]}
                      max={1000}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="my-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="multiselect">
            <AccordionTrigger className="text-base font-medium py-2">Multi-Select Colors</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COLOR_OPTIONS.slice(1).map((colorOption) => (
                  <div key={colorOption} className="flex items-center space-x-2">
                    <Checkbox
                      id={`color-${colorOption}`}
                      checked={selectedColors.includes(colorOption)}
                      onCheckedChange={() => toggleColorSelection(colorOption)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`color-${colorOption}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {colorOption}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="pt-2 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="text-foreground hover:bg-muted text-xs h-8 px-3"
          >
            Reset
          </Button>
          <Button className="bg-primary text-primary-foreground text-xs h-8 px-3" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

