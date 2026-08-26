# Administrator Operations Enhancements Validation

Using a freshly authenticated administrator session, entering **Meta** in the published **Find a client** control reduced the organisation switcher options to **All organisations** and **Meta Results (1)** while preserving the all-organisations dashboard context. The next checks will apply that filtered client, refresh its scoped metrics, and advance the participant result page.

Selecting **Meta Results** updated the URL to `tenant=1`, produced scoped live metrics of **1 organisation**, **1 person**, and **5 active enrolments**, and reduced consolidated search to the single Meta Results participant. Pagination accurately reported **Showing 1–1 of 1 participants** and disabled the unavailable previous and next navigation.

The published **Refresh** action completed against the active Meta Results workspace without changing its scoped values. Returning the switcher to **All organisations** restored the global metrics (**10 organisations**, **33 people**, and **18 active enrolments**) and the multi-page result set (**Showing 1–10 of 33 participants**, page 1 of 4).

Activating the published **Next** control loaded a distinct second result page with ten further records and correctly updated the status to **Showing 11–20 of 33 participants**, **Page 2 of 4**.
