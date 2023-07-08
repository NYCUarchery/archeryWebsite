#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace std;

int main()
{

    ifstream file;
    ofstream output;
    int num_of_players;
    int num_of_columns;

    file.open("./input.txt");
    output.open("./output.json");

    if (file.fail())
    {
        cout << "ERROR: Could not open";
        return 0;
    }

    file >> num_of_columns >> num_of_players;

    cout << num_of_columns << endl;

    vector<string> column_names;

    cout << num_of_players << endl;

    for (int i = 0; i < num_of_columns; i++)
    {
        string name;
        file >> name;

        column_names.push_back(name);
    }

    output << "{" << endl;
    output << "  \"players\": [" << endl;

    for (int i = 0; i < num_of_players; i++)
    {
        output << "    {" << endl;
        for (int j = 0; j < num_of_columns; j++)
        {
            string info;
            file >> info;
            output << "      \"" << column_names[j] << "\": \"" << info << "\"";

            if (j != num_of_columns - 1)
            {
                output << ",";
            }
            output << endl;
        }
        output << "    }";

        if (i != num_of_players - 1)
        {
            output << ",";
        }
        output << endl;
    }

    output << "  ]" << endl;
    output << "}" << endl;

    file.close();
    output.close();

    return 0;
}