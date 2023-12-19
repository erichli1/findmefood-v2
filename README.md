## TLDR
Find the best local restaurants, without scrolling for minutes.

## Problem
Google Maps allows you to filter by rating but not by number of reviews. However, often when I'm going on trips, I want to know the best restaurants in the area (highly rated with many of reviews). It's easy for those must-go restaurants to be drowned out by the new restaurants that are well-rated but with just a few reviews.

## Solution
This webapp allows you to filter restaurants by rating, number of reviews, and distance.

## Setup
`yarn dev` to run the development server

## Tech notes
The Google Maps API has various rate-limiting features, requiring a few seconds of downtime before the pagination token is valid and only returning a maximum of 60 results (3 pages of 20 results). This means that 1) users have loading times of at least 4 seconds, and 2) this is not an exhaustive search. Specifically, because the API also does not allow filtering by number of reviews, we merely retrieve the top 60 results and then filter those to only show you the restaurants that meet your criteria.